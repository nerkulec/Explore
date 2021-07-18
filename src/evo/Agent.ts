import { Bodies, Composite, Body, Constraint } from 'matter-js'
import { P5Instance } from '../components/P5Wrapper'

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

export const createRect = (x: number, y: number, w: number, h: number, options?: any): Body => {
  let chamfer = undefined
  if (options?.chamfer) {
    chamfer = options.chamfer
  }
  const rect = Bodies.rectangle(x, y, w, h, options) as any
  rect.w = w
  rect.h = h
  if (chamfer) {
    rect.chamfer = chamfer
  }
  return rect as Body
}

export const drawRect = (p: P5Instance, rect: Body) => {
  p.push()
  p.rectMode(p.CENTER)
  p.translate(rect.position.x, rect.position.y)
  p.rotate(rect.angle)
  p.fill(127)
  p.rect(0, 0, (rect as any).w, (rect as any).h, (rect as any)?.chamfer?.radius || 0)
  p.pop()
}

export class Cheetah extends PhysicsAgent {
  bodies: Body[]
  torso: Body
  rleg: Body[]
  fleg: Body[]
  constraints: Constraint[]
  composite: Composite

  constructor(p5: P5Instance) {
    super(p5)
    const length = 240
    const height = 260
    const margin = 10
    const leg_height = (height-2*margin)/3
    this.constraints = []
    const group = Body.nextGroup(true)
    this.torso = createRect(0, 140, length, 20, {
      collisionFilter: { group },
      chamfer: { radius: margin }
    })
    this.rleg = []
    this.fleg = []
    for (let i=0; i<3; i++) {
      this.rleg.push(createRect(-length/2+margin, 170+(leg_height-2*margin)*i, 2*margin, leg_height, {
        collisionFilter: { group },
        chamfer: { radius: margin }
      }))
    }
    this.fleg.push(createRect(length/2-margin, 170, 2*margin, leg_height, {
      collisionFilter: { group },
      chamfer: { radius: margin }
    }))
    const fleg_height2 = 2*leg_height-2*margin-0.3*leg_height
    // const fleg_height2 = 2*leg_height-2*margin
    this.fleg.push(createRect(length/2-margin, 170+fleg_height2/2+2*margin, 2*margin, fleg_height2, {
      collisionFilter: { group },
      chamfer: { radius: margin }
    }))
    // rear leg constraints
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[0],
      pointA: { x: 0, y: -leg_height/2+margin },
      bodyB: this.torso,
      pointB: { x: -length/2+margin, y: 0 }
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[1],
      pointA: { x: 0, y: -leg_height/2+margin },
      bodyB: this.rleg[0],
      pointB: { x: 0, y: leg_height/2-margin }
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[2],
      pointA: { x: 0, y: -leg_height/2+margin },
      bodyB: this.rleg[1],
      pointB: { x: 0, y: leg_height/2-margin }
    }))
    // front leg constraints
    this.constraints.push(Constraint.create({
      bodyA: this.fleg[0],
      pointA: { x: 0, y: -leg_height/2+margin },
      bodyB: this.torso,
      pointB: { x: length/2-margin, y: 0 }
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.fleg[1],
      pointA: { x: 0, y: -fleg_height2/2+margin },
      bodyB: this.fleg[0],
      pointB: { x: 0, y: leg_height/2-margin }
    }))
    Body.rotate(this.rleg[0], 1)
    Body.rotate(this.rleg[1], -1)
    Body.rotate(this.rleg[2], 1)
    Body.rotate(this.fleg[0], 1)
    Body.rotate(this.fleg[1], -1)
    // rear leg "angle" constraints
    const angle_stiffness = 0.1
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[0],
      pointA: { x: 0, y: leg_height/2-margin },
      bodyB: this.torso,
      pointB: { x: length/2-margin, y: 0 },
      stiffness: angle_stiffness
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[1],
      pointA: { x: 0, y: leg_height/2-margin },
      bodyB: this.rleg[0],
      pointB: { x: 0, y: -leg_height/2+margin },
      stiffness: angle_stiffness
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[2],
      pointA: { x: 0, y: leg_height/2-margin },
      bodyB: this.rleg[1],
      pointB: { x: 0, y: -leg_height/2+margin },
      stiffness: angle_stiffness
    }))
    // front leg "angle" constraints
    this.constraints.push(Constraint.create({
      bodyA: this.fleg[0],
      pointA: { x: 0, y: leg_height/2-margin },
      bodyB: this.torso,
      pointB: { x: -length/2+margin, y: 0 },
      stiffness: angle_stiffness
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.fleg[1],
      pointA: { x: 0, y: leg_height/2-margin },
      bodyB: this.fleg[0],
      pointB: { x: 0, y: -leg_height/2+margin },
      stiffness: angle_stiffness
    }))
    this.composite = Composite.create()
    this.bodies = [...this.rleg, ...this.fleg, this.torso]
    Composite.add(this.composite, [...this.bodies, ...this.constraints])
  }

  draw() {
    const p = this.p5
    for (const body of this.bodies) {
      drawRect(p, body)
    }
  }
}
