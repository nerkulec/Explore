import { P5Instance } from '../components/P5Wrapper'
import { Capsule, Body, Shape, RotationalSpring, RevoluteConstraint, Plane, Circle } from 'p2'

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

const range = (n: number) => [...Array(n).keys()]

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
    const height = 260
    const margin = 10
    const leg_height = height/3
    this.torque_scale = 0.5
    this.bodies = []
    this.constraints = []
    this.springs = []
    const torso_shape = new Capsule({length, radius: margin})
    this.torso = new Body({
      mass: 1,
      position : [0, 400]
    })
    this.rleg = []
    this.fleg = []
    this.torso.addShape(torso_shape)
    this.bodies.push(this.torso)
    // this.springs.push(new RotationalSpring(this.torso, this.torso2, {
    //   stiffness: 1000000,
    //   restAngle: -1
    // }))
    // this.constraints.push(new RevoluteConstraint(this.torso, this.torso2, {
    //   localPivotA: [-length/2, 0],
    //   localPivotB: [ length/2, 0],
    //   collideConnected: false
    // }))
    const rleg_shapes = Array(3).map(() => new Capsule({length: leg_height, radius: margin}))

    // this.rleg = []
    // this.fleg = []
    // for (let i=0; i<3; i++) {
    //   this.rleg.push(createRect(-length/2+margin, 170+(leg_height-2*margin)*i, 2*margin, leg_height, {
    //     collisionFilter: { group },
    //     chamfer: { radius: margin },
    //     friction: 0.5
    //   }))
    // }
    // this.fleg.push(createRect(length/2-margin, 170, 2*margin, leg_height))
    // this.fleg.push(createRect(length/2-margin, 170+fleg_height2/2+2*margin, 2*margin, fleg_height2))
    // // rear leg constraints
    // this.constraints.push(Constraint.create({
    //   bodyA: this.rleg[0],
    //   pointA: { x: 0, y: -leg_height/2+margin },
    //   bodyB: this.torso,
    //   pointB: { x: -length/2+margin, y: 0 }
    // }))
    // this.constraints.push(Constraint.create({
    //   bodyA: this.rleg[1],
    //   pointA: { x: 0, y: -leg_height/2+margin },
    //   bodyB: this.rleg[0],
    //   pointB: { x: 0, y: leg_height/2-margin }
    // }))
    // this.constraints.push(Constraint.create({
    //   bodyA: this.rleg[2],
    //   pointA: { x: 0, y: -leg_height/2+margin },
    //   bodyB: this.rleg[1],
    //   pointB: { x: 0, y: leg_height/2-margin }
    // }))
    // // front leg constraints
    // this.constraints.push(Constraint.create({
    //   bodyA: this.fleg[0],
    //   pointA: { x: 0, y: -leg_height/2+margin },
    //   bodyB: this.torso,
    //   pointB: { x: length/2-margin, y: 0 }
    // }))
    // this.constraints.push(Constraint.create({
    //   bodyA: this.fleg[1],
    //   pointA: { x: 0, y: -fleg_height2/2+margin },
    //   bodyB: this.fleg[0],
    //   pointB: { x: 0, y: leg_height/2-margin }
    // }))
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
