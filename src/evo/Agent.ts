import { P5Instance } from '../components/P5Wrapper'
import { Capsule, Body, RotationalSpring, RevoluteConstraint, Circle, vec2 } from 'p2'

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
  p.translate(...body.position as v2)
  p.rotate(body.angle)
  for (const shape of body.shapes){
    if (shape instanceof Capsule) {
      p.fill(127)
      p.rect(0, 0, shape.length+2*shape.radius, 2*shape.radius)//, shape.radius)
      // p.fill(0)
      // p.circle(0, 0, 0.1)
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
export type CheetahObservationSpace =
  [number, number, number, number, number, number, number, number, number, number]

export class Cheetah extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  springs: RotationalSpring[]
  torso: Body
  rleg: [Body, Body, Body]
  fleg: [Body, Body, Body]
  head: Body
  torque_scale: number = 50
  torque_coefs: CheetahActionSpace = [2, 1, 1, 1.2, 1, 0.5]
  lengths: [number, number, number, number]
  rleg_joints: [Body, Body, Body, Body]
  fleg_joints: [Body, Body, Body, Body]
  rleg_angles: [number, number, number]
  fleg_angles: [number, number, number]
  starting_positions: v2[]

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
    const torso_shape = new Capsule({length, radius: margin})
    this.torso = new Body({mass: length, position : [0, start_y]})
    this.torso.addShape(torso_shape)
    const head_shape = new Capsule({length: leg_height, radius: margin})
    this.head = new Body({mass: 0.01, position : [length/2+leg_height/2, start_y]})
    this.head.addShape(head_shape)
    this.rleg = [] as any
    this.fleg = [] as any
    this.lengths = [length, leg_height, leg_height, leg_height/2]
    const positions = [0.5*leg_height, 1.5*leg_height, 2.25*leg_height]
    this.rleg_angles = [2.42, -Math.PI/2, Math.PI/2]
    this.fleg_angles = [-2.2, Math.PI/1.8, 0]
    const rleg_shapes = []
    const fleg_shapes = []
    for (let i=1; i<4; i++) {
      rleg_shapes.push(new Capsule({length: this.lengths[i], radius: margin}))
      fleg_shapes.push(new Capsule({length: this.lengths[i], radius: margin}))
    }
    for (let i=0; i<3; i++) {
      this.rleg.push(new Body({mass: this.lengths[i], position: [-length/2-positions[i], start_y]}))
      this.fleg.push(new Body({mass: this.lengths[i], position: [ length/2+positions[i], start_y]}))
      this.rleg[i].addShape(rleg_shapes[i])
      this.fleg[i].addShape(fleg_shapes[i])
    }
    this.rleg_joints = [this.torso, ...this.rleg]
    this.fleg_joints = [this.torso, ...this.fleg]
    // springs
    const stiffness = 150
    const damping = 1.5
    for (let i=0; i<3; i++) {
      this.springs.push(new RotationalSpring(
        this.rleg_joints[i], this.rleg_joints[i+1], {
        restAngle: this.rleg_angles[i],
        stiffness, damping
      }))
      this.springs.push(new RotationalSpring(
        this.fleg_joints[i], this.fleg_joints[i+1], {
        restAngle: this.fleg_angles[i],
        stiffness, damping
      }))
    }
    this.springs.push(new RotationalSpring(
      this.torso, this.head, {
      restAngle: 0.5,
      stiffness, damping
    }))
    // constraints
    for (let i=0; i<3; i++) {
      this.constraints.push(new RevoluteConstraint(
        this.rleg_joints[i], this.rleg_joints[i+1], {
        localPivotA: [-this.lengths[i]/2, 0],
        localPivotB: [this.lengths[i+1]/2, 0],
        collideConnected: false
      }))
      this.constraints.push(new RevoluteConstraint(
        this.fleg_joints[i], this.fleg_joints[i+1], {
        localPivotA: [this.lengths[i]/2, 0],
        localPivotB: [-this.lengths[i+1]/2, 0],
        collideConnected: false
      }))
    }
    this.constraints.push(new RevoluteConstraint(
      this.torso, this.head, {
      localPivotA: [length/2, 0],
      localPivotB: [-leg_height/2, 0],
      collideConnected: false
    }))
    // this.reset()
    this.bodies.push(this.torso, this.head, ...this.rleg, ...this.fleg)
    this.starting_positions = this.bodies.map(body => [...body.position as v2])
  }

  reset() {
    // leg placement
    for (let i=0; i<this.bodies.length; i++) {
      const body = this.bodies[i]
      body.position = [...this.starting_positions[i]]
      body.angle = 0
      body.velocity = [0, 0]
      body.angularVelocity = 0
    }
    for (let i=0; i<3; i++) {
      const rleg_preankle = this.rleg_joints[i].position as v2
      const rleg_postankle = this.rleg_joints[i+1].position as v2
      const rleg_pre_pivot: v2 = [-this.lengths[i]/2, 0]
      const rleg_post_pivot: v2 = [this.lengths[i+1]/2, 0]
      const fleg_preankle = this.fleg_joints[i].position as v2
      const fleg_postankle = this.fleg_joints[i+1].position as v2
      const fleg_pre_pivot: v2 = [this.lengths[i]/2, 0]
      const fleg_post_pivot: v2 = [-this.lengths[i+1]/2, 0]
      vec2.rotate(rleg_post_pivot, rleg_post_pivot, sum(this.rleg_angles.slice(0, i+1)))
      vec2.rotate(rleg_pre_pivot, rleg_pre_pivot, sum([0, ...this.rleg_angles].slice(0, i+1)))
      vec2.rotate(fleg_post_pivot, fleg_post_pivot, sum(this.fleg_angles.slice(0, i+1)))
      vec2.rotate(fleg_pre_pivot, fleg_pre_pivot, sum([0, ...this.fleg_angles].slice(0, i+1)))
      const rleg_delta = sub(add(rleg_preankle, rleg_pre_pivot), add(rleg_postankle, rleg_post_pivot))
      const fleg_delta = sub(add(fleg_preankle, fleg_pre_pivot), add(fleg_postankle, fleg_post_pivot))
      const rleg_pos = this.rleg[i].position
      const fleg_pos = this.fleg[i].position
      vec2.add(rleg_pos, rleg_pos, rleg_delta)
      vec2.add(fleg_pos, fleg_pos, fleg_delta)
      for (let j=i; j<3; j++) {
        this.rleg[j].angle += this.rleg_angles[i]
        this.fleg[j].angle += this.fleg_angles[i]
      }
    }
  }

  getObservation(): CheetahObservationSpace {
    return [
      Math.cos(2*Math.PI*this.torso.position[0]/10),
      Math.sin(2*Math.PI*this.torso.position[0]/10),
      this.torso.position[1],
      this.torso.angle,
      this.rleg[0].angle - this.torso.angle,
      this.rleg[1].angle-this.rleg[0].angle,
      this.rleg[2].angle-this.rleg[1].angle,
      this.fleg[0].angle - this.torso.angle,
      this.fleg[1].angle-this.fleg[0].angle,
      this.fleg[2].angle-this.fleg[1].angle,
    ]
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
