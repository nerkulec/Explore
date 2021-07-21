import { P5Instance } from '../components/P5Wrapper'
import { Capsule, Body, Shape, RotationalSpring, RevoluteConstraint, Plane, Circle, vec2 } from 'p2'

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
  p.translate(...body.position)
  p.rotate(body.angle)
  for (const shape of body.shapes){
    if (shape instanceof Capsule) {
      p.fill(127)
      p.rect(0, 0, shape.length+2*shape.radius, 2*shape.radius, shape.radius)
    }
    if (shape instanceof Plane) {
      p.fill(230)
      p.rectMode(p.CORNER)
      p.rect(-10000, 0, 20000, -10000)
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

export class Cheetah extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  springs: RotationalSpring[]
  torso: Body
  rleg: Body[]
  fleg: Body[]
  torque_scale: number

  constructor(p5: P5Instance) {
    super(p5)
    const length = 240
    const height = 240
    const margin = 10
    const leg_height = height/3
    this.torque_scale = 0.5
    this.bodies = []
    this.constraints = []
    this.springs = []
    const torso_shape = new Capsule({length, radius: margin})
    this.torso = new Body({mass: 1, position : [0, 400]})
    this.rleg = []
    this.fleg = []
    this.torso.addShape(torso_shape)
    const lengths = [leg_height, leg_height, leg_height/2]
    const positions = [0.5*leg_height, 1.5*leg_height, 2.25*leg_height]
    const rleg_angles = [2.4, -Math.PI/2, Math.PI/2]
    const fleg_angles = [-2.2, Math.PI/2, 0]
    const rleg_shapes = []
    const fleg_shapes = []
    for (let i=0; i<3; i++) {
      rleg_shapes.push(new Capsule({length: lengths[i], radius: margin}))
      fleg_shapes.push(new Capsule({length: lengths[i], radius: margin}))
    }
    for (let i=0; i<3; i++) {
      this.rleg.push(new Body({mass: 1, position: [-length/2-positions[i], 400]}))
      this.fleg.push(new Body({mass: 1, position: [ length/2+positions[i], 400]}))
      this.rleg[i].addShape(rleg_shapes[i])
      this.fleg[i].addShape(fleg_shapes[i])
    }
    const rleg_springs = [this.torso, ...this.rleg]
    const fleg_springs = [this.torso, ...this.fleg]
    for (let i=0; i<3; i++) {
      this.springs.push(new RotationalSpring(
      rleg_springs[i], rleg_springs[i+1], {
        restAngle: rleg_angles[i],
        stiffness: 1000000,
        damping: 0.9
      }))
      this.springs.push(new RotationalSpring(
      fleg_springs[i], fleg_springs[i+1], {
        restAngle: fleg_angles[i],
        stiffness: 1000000,
        damping: 0.9
      }))
    }
    // leg constraints
    for (let i=0; i<2; i++) {
      this.constraints.push(new RevoluteConstraint(
        this.rleg[i], this.rleg[i+1], {
        localPivotA: [-lengths[i]/2, 0],
        localPivotB: [lengths[i+1]/2, 0],
        collideConnected: false
      }))
      this.constraints.push(new RevoluteConstraint(
        this.fleg[i], this.fleg[i+1], {
        localPivotA: [lengths[i]/2, 0],
        localPivotB: [-lengths[i+1]/2, 0],
        collideConnected: false
      }))
    }
    this.constraints.push(new RevoluteConstraint(
      this.torso, this.rleg[0], {
        localPivotA: [-height/2, 0],
        localPivotB: [leg_height/2, 0],
        collideConnected: false
    }))
    this.constraints.push(new RevoluteConstraint(
      this.torso, this.fleg[0], {
        localPivotA: [height/2, 0],
        localPivotB: [-leg_height/2, 0],
        collideConnected: false
    }))
    // for (let i=0; i<3; i++) {
    //   const rleg_pos = this.rleg[i].position
    //   const relPivotA: [number, number] = [-lengths[i]/2, 0]
    //   const relPivotB: [number, number] = [lengths[i+1]/2, 0]
    //   vec2.rotate(relPivotA, relPivotA, rleg_angles[i])
    //   vec2.rotate(relPivotB, relPivotA, rleg_angles[i+1])
    //   const delta = sub(add(this))
    //   for (let j=i; j<3; j++) {
    //     this.rleg[j].angle += rleg_angles[i]
    //     this.fleg[j].angle += fleg_angles[i]
    //   }
    // }
    this.bodies.push(this.torso, ...this.rleg, ...this.fleg)
  }

  applyTorque(torque: [number, number, number, number, number]) {
    // const limbs_a = [this.rleg[0], this.rleg[1], this.rleg[2], this.fleg[0], this.fleg[1]]
    // const limbs_b = [this.torso, this.rleg[0], this.rleg[1], this.torso, this.fleg[0]]
    for (let i=0; i<5; i++) {
      // limbs_a[i].torque += torque[i]/limbs_a[i].mass*this.torque_scale
      // limbs_b[i].torque -= torque[i]/limbs_a[i].mass*this.torque_scale
    }
  }

  draw() {
    const p = this.p5
    for (const body of this.bodies) {
      drawBody(p, body)
    }
  }
}
