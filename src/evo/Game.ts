import { World, Body, Plane } from "p2"
import { P5Instance } from "../components/P5Wrapper"
import { Cheetah, drawBody } from "./Agent"

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
  abstract update(torque: number[]): void
  abstract draw(): void
}

export class CheetahGame extends PhysicsGame {
  world: World
  fixedTimestep: number = 1/60
  ground: Body
  cheetah: Cheetah

  constructor(p5: P5Instance) {
    super(p5)
    // createRect(0, 340, 1080, 20, { isStatic: true })
    this.world = new World({
      gravity : [0, -900]
    })
    this.ground = new Body({
      mass: 0
    })
    const groundShape = new Plane({position: [0, 340]})
    this.ground.addShape(groundShape)
    this.world.addBody(this.ground)
    this.cheetah = new Cheetah(p5)
    this.cheetah.bodies.forEach(b => this.world.addBody(b))
    this.cheetah.constraints.forEach(c => this.world.addConstraint(c))
    this.cheetah.springs.forEach(s => this.world.addSpring(s))
    this.reset()
  }

  update(torque: [number, number, number, number, number]) {
    this.world.step(this.fixedTimestep)
    console.log(this.world.bodies[1].position)
    this.cheetah.applyTorque(torque)
  }

  draw() {
    const p = this.p5
    p.background(191)
    drawBody(p, this.ground)
    this.cheetah.draw()
  }

  reset() {
    super.reset()
  }
}
