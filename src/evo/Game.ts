import { Composite, Engine } from "matter-js"
import { P5Instance } from "../components/P5Wrapper"
import { Cheetah, createRect, drawRect } from "./Agent"
import { Body } from 'matter-js'

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

export class CheetahGame extends PhysicsGame {
  engine: Engine
  ground: Body
  fences: Body[]
  cheetah: Cheetah

  constructor(p5: P5Instance) {
    super(p5)
    this.engine = Engine.create()
    this.ground = createRect(0, 340, 1080, 20, { isStatic: true })
    this.fences = []
    this.cheetah = new Cheetah(this.p5)
    Composite.add(this.engine.world, [this.ground, this.cheetah.composite])
    this.reset()
  }

  update() {
    Engine.update(this.engine)
  }

  draw() {
    const p = this.p5
    drawRect(p, this.ground)
    this.cheetah.draw()
  }

  reset() {
    super.reset()
  }
}
