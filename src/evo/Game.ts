import { Engine } from "matter-js"
import { P5Instance } from "../components/P5Wrapper"
import * as matter from 'matter-js'
const { Bodies, Composite, Body } = matter

export interface Game {
  reset(): void
  draw(): void
  reward: number
}

abstract class PhysicsGame implements Game {
  p5: P5Instance
  reward: number

  constructor(p5: P5Instance) {
    this.p5 = p5
    this.reward = 0
  }
  reset() {
    this.reward = 0
  }
  abstract update(): void
  abstract draw(): void
}

class Rect extends Body {
  w: number = 0
  h: number = 0
}

const createRect = (x: number, y: number, w: number, h: number, options?: any): Rect => {
  const rect = Bodies.rectangle(x, y, w, h, options) as Rect
  rect.w = w
  rect.h = h
  return rect
}

export class CheetahGame extends PhysicsGame {
  engine: Engine
  // boxA: Rect
  // boxB: Rect
  // ground: Rect

  constructor(p5: P5Instance) {
    super(p5)
    this.engine = Engine.create()
    // this.boxA = createRect(400, 200, 80, 80)
    // this.boxB = createRect(450, 50, 80, 80)
    // this.ground = createRect(400, 610, 810, 60, { isStatic: true })
    // Composite.add(this.engine.world, [this.boxA, this.boxB, this.ground])
    this.reset()
  }

  update() {
    // add torque
    Engine.update(this.engine)
  }

  draw() {
    const p = this.p5
    // for (const body of [this.boxA, this.boxB, this.ground]) {
    //   p.push()
    //   p.translate(body.position.x, body.position.y)
    //   p.rotate(body.angle)
    //   p.rectMode(p.CENTER)
    //   p.rect(0, 0, body.w, body.h)
    //   p.pop()
    // }
  }

  reset() {
    super.reset()
  }
}
