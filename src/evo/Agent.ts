import { P5Instance } from '../components/P5Wrapper'
import { Capsule, Body, RotationalSpring, RevoluteConstraint, Plane, Circle, vec2 } from 'p2'

export interface Agent {
  draw(): void
}

abstract class PhysicsAgent implements Agent {
  p5: P5Instance

  constructor(p5: P5Instance) {
    this.p5 = p5

  }
  abstract draw(): void
}

export const drawBody = (p: P5Instance, body: Body) => {
  p.push()
  p.rectMode(p.CENTER)
  p.translate(...body.position as [number, number])
  p.rotate(body.angle)
  for (const shape of body.shapes){
    if (shape instanceof Capsule) {
      p.fill(127)
      p.rect(0, 0, shape.length+2*shape.radius, 2*shape.radius, shape.radius)
    }
    if (shape instanceof Circle) {
      p.fill(230)
      p.circle(0, 0, shape.radius)
    }
  }
  p.pop()
}
type v2 = [number, number]
const add = ([x1, y1]: v2, [x2, y2]: v2): v2 => [x1+x2, y1+y2]
const sub = ([x1, y1]: v2, [x2, y2]: v2): v2 => [x1-x2, y1-y2]
const sum = (xs: number[]): number => xs.reduce((s, x) => s+x, 0)

export type CheetahActionSpace = [number, number, number, number, number, number]

export class Cheetah extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  springs: RotationalSpring[]
  torso: Body
  rleg: Body[]
  fleg: Body[]
  head: Body
  torque_scale: number = 50
  torque_coefs: CheetahActionSpace = [1, 1, 1, 1, 1, 0.2]

  constructor(p5: P5Instance) {
    super(p5)
    const length = 2.40
    const height = 2.40
    const margin = 0.10
    const start_y = 1.50
    const leg_height = height/3
    this.bodies = []
    this.constraints = []
    this.springs = []
    const neck_mask = 0
    const torso_shape = new Capsule({length, radius: margin})
    torso_shape.collisionGroup = 1
    torso_shape.collisionMask = neck_mask
    this.torso = new Body({mass: length, position : [0, start_y]})
    this.torso.addShape(torso_shape)
    const head_shape = new Capsule({length: leg_height, radius: margin})
    head_shape.collisionGroup = 2
    head_shape.collisionMask = neck_mask
    this.head = new Body({mass: leg_height, position : [length/2+leg_height/2, start_y]})
    this.head.addShape(head_shape)
    this.rleg = []
    this.fleg = []
    const lengths = [length, leg_height, leg_height, leg_height/2]
    const positions = [0.5*leg_height, 1.5*leg_height, 2.25*leg_height]
    const rleg_angles = [2.42, -Math.PI/2, Math.PI/2]
    const fleg_angles = [-2.2, Math.PI/2, 0]
    const rleg_shapes = []
    const fleg_shapes = []
    for (let i=1; i<4; i++) {
      rleg_shapes.push(new Capsule({length: lengths[i], radius: margin}))
      fleg_shapes.push(new Capsule({length: lengths[i], radius: margin}))
    }
    fleg_shapes[0].collisionGroup = 4
    fleg_shapes[0].collisionMask = neck_mask
    for (let i=0; i<3; i++) {
      this.rleg.push(new Body({mass: lengths[i], position: [-length/2-positions[i], start_y]}))
      this.fleg.push(new Body({mass: lengths[i], position: [ length/2+positions[i], start_y]}))
      this.rleg[i].addShape(rleg_shapes[i])
      this.fleg[i].addShape(fleg_shapes[i])
    }
    const rleg_joints = [this.torso, ...this.rleg]
    const fleg_joints = [this.torso, ...this.fleg]
    // springs
    const stiffness = 150
    const damping = 1.5
    for (let i=0; i<3; i++) {
      this.springs.push(new RotationalSpring(
        rleg_joints[i], rleg_joints[i+1], {
        restAngle: rleg_angles[i],
        stiffness, damping
      }))
      this.springs.push(new RotationalSpring(
        fleg_joints[i], fleg_joints[i+1], {
        restAngle: fleg_angles[i],
        stiffness, damping
      }))
    }
    // this.springs.push(new RotationalSpring(
    //   this.torso, this.head, {
    //   restAngle: 0,
    //   stiffness, damping
    // }))
    // constraints
    for (let i=0; i<3; i++) {
      this.constraints.push(new RevoluteConstraint(
        rleg_joints[i], rleg_joints[i+1], {
        localPivotA: [-lengths[i]/2, 0],
        localPivotB: [lengths[i+1]/2, 0],
        collideConnected: false
      }))
      this.constraints.push(new RevoluteConstraint(
        fleg_joints[i], fleg_joints[i+1], {
        localPivotA: [lengths[i]/2, 0],
        localPivotB: [-lengths[i+1]/2, 0],
        collideConnected: false
      }))
    }
    // this.constraints.push(new RevoluteConstraint(
    //   this.torso, this.head, {
    //   localPivotA: [length/2, 0],
    //   localPivotB: [-lengths[1]/2],
    //   collideConnected: false
    // }))

    // leg placement
    for (let i=0; i<3; i++) {
      const rleg_preankle = rleg_joints[i].position as [number, number]
      const rleg_postankle = rleg_joints[i+1].position as [number, number]
      const rleg_pre_pivot: [number, number] = [-lengths[i]/2, 0]
      const rleg_post_pivot: [number, number] = [lengths[i+1]/2, 0]
      const fleg_preankle = fleg_joints[i].position as [number, number]
      const fleg_postankle = fleg_joints[i+1].position as [number, number]
      const fleg_pre_pivot: [number, number] = [lengths[i]/2, 0]
      const fleg_post_pivot: [number, number] = [-lengths[i+1]/2, 0]
      vec2.rotate(rleg_post_pivot, rleg_post_pivot, sum(rleg_angles.slice(0, i+1)))
      vec2.rotate(rleg_pre_pivot, rleg_pre_pivot, sum([0, ...rleg_angles].slice(0, i+1)))
      vec2.rotate(fleg_post_pivot, fleg_post_pivot, sum(fleg_angles.slice(0, i+1)))
      vec2.rotate(fleg_pre_pivot, fleg_pre_pivot, sum([0, ...fleg_angles].slice(0, i+1)))
      const rleg_delta = sub(add(rleg_preankle, rleg_pre_pivot), add(rleg_postankle, rleg_post_pivot))
      const fleg_delta = sub(add(fleg_preankle, fleg_pre_pivot), add(fleg_postankle, fleg_post_pivot))
      const rleg_pos = this.rleg[i].position
      const fleg_pos = this.fleg[i].position
      vec2.add(rleg_pos, rleg_pos, rleg_delta)
      vec2.add(fleg_pos, fleg_pos, fleg_delta)
      for (let j=i; j<3; j++) {
        this.rleg[j].angle += rleg_angles[i]
        this.fleg[j].angle += fleg_angles[i]
      }
    }
    this.bodies.push(this.torso, this.head, ...this.rleg, ...this.fleg)
  }

  applyTorque(torque: CheetahActionSpace) {
    const limbs_a = [this.rleg[0], this.rleg[1], this.rleg[2], ...this.fleg]
    const limbs_b = [this.torso, this.rleg[0], this.rleg[1], this.torso, ...this.fleg]
    for (let i=0; i<6; i++) {
      limbs_a[i].angularForce += torque[i]*this.torque_scale*this.torque_coefs[i]
      limbs_b[i].angularForce -= torque[i]*this.torque_scale*this.torque_coefs[i]
    }
  }

  draw() {
    const p = this.p5
    for (const body of this.bodies) {
      drawBody(p, body)
    }
  }
}
