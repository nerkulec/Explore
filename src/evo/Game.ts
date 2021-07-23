import { World, Body, Plane } from "p2"
import { P5Instance } from "../components/P5Wrapper"
import { Cheetah, drawBody, CheetahActionSpace, CheetahObservationSpace } from "./Agent"

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
    this.world = new World({
      gravity : [0, -9],
    })
    this.world.defaultContactMaterial.friction = 5
    this.ground = new Body({
      mass: 0
    })
    const groundShape = new Plane({position: [0, 0]})
    this.ground.addShape(groundShape)
    this.world.addBody(this.ground)
    this.cheetah = new Cheetah(p5)
    this.cheetah.bodies.forEach(b => this.world.addBody(b))
    this.cheetah.constraints.forEach(c => this.world.addConstraint(c))
    this.cheetah.springs.forEach(s => this.world.addSpring(s))
    // ;(this.world.solver as any).tolerance = 0.00001
    ;(this.world.solver as any).iterations = 1000
    this.reset()
  }

  update(torque: CheetahActionSpace) {
    this.world.step(this.fixedTimestep)
    this.cheetah.applyTorque(torque)
  }

  draw() {
    const p = this.p5
    // p.background(191)
    p.fill(191)
    p.noStroke()
    p.rect(-p.width/2, -p.height/2, p.width, p.height)
    p.scale(1, -1)
    p.fill(230)
    p.rectMode(p.CORNER)
    p.rect(-p.width/2, -180, p.width, -180)
    p.scale(180, 180)
    p.translate(0, -1)
    const cheetah_x = this.cheetah.torso.position[0]
    p.translate(-cheetah_x, 0)
    p.fill(0)
    const start = Math.floor(cheetah_x)+1
    for (let i=0; i<p.width/100; i+=1) {
      const x = -p.width/200+i+start
      if (x-cheetah_x+0.2<p.width/200)
        p.rect(x, -0.2, 0.1, 0.2)
    }
    this.cheetah.draw()
  }

  reset(): CheetahObservationSpace {
    super.reset()
    const observation = this.cheetah.getObservation()
    this.cheetah.reset()
    return observation
  }
}
