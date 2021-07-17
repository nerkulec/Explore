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
    console.log(rect)
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
  rleg: Body[]
  constraints: Constraint[]
  composite: Composite

  constructor(p5: P5Instance) {
    super(p5)
    const length = 240
    const height = 180
    const leg_height = height/3
    const margin = 10
    this.constraints = []
    const group = Body.nextGroup(true)
    const torso = createRect(80, 200, length, 20, {
      collisionFilter: { group }
    })
    this.rleg = []
    for (let i=0; i<3; i++) {
      this.rleg.push(createRect(-30, 220+(leg_height-2*margin)*i, 20, leg_height, {
        collisionFilter: { group },
        chamfer: { radius: 10 }
      }))
    }
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[0],
      pointA: {
          x: 0,
          y: -leg_height/2+margin
      },
      bodyB: torso,
      pointB: {
          x: -length/2+margin,
          y: 0
      },
      stiffness: 0.6
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[1],
      pointA: {
          x: 0,
          y: -leg_height/2+margin
      },
      bodyB: this.rleg[0],
      pointB: {
          x: 0,
          y: leg_height/2-margin
      },
      stiffness: 0.6
    }))
    this.constraints.push(Constraint.create({
      bodyA: this.rleg[2],
      pointA: {
          x: 0,
          y: -leg_height/2+margin
      },
      bodyB: this.rleg[1],
      pointB: {
          x: 0,
          y: leg_height/2-margin
      },
      stiffness: 0.6
    }))
    const fleg = createRect(190, 260, 20, 140, {
      collisionFilter: { group }
    })
    this.constraints.push(Constraint.create({
      bodyA: fleg,
      pointA: {
          x: 0,
          y: -60
      },
      bodyB: torso,
      pointB: {
          x: length/2-margin,
          y: 0
      },
      stiffness: 0.6
    }))
    this.composite = Composite.create()
    this.bodies = [...this.rleg, fleg, torso]
    Composite.add(this.composite, [...this.bodies, ...this.constraints])
  }

  draw() {
    const p = this.p5
    for (const body of this.bodies) {
      drawRect(p, body)
    }
  }
}
