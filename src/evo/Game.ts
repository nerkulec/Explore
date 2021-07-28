import { World, Body, Plane } from "p2"
import { P5Instance } from "../components/P5Wrapper"
import { Cheetah, CheetahActionSpace, CheetahObservationSpace } from "./Agent"

export interface Game {
  reset(): void
  update(action: number[]): void
  getObservation(): number[]
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
  abstract getObservation(): number[]
  abstract update(action: number[]): void
  abstract draw(): void
}

export class CheetahGame extends PhysicsGame {
  world: World
  fixedTimestep: number = 1/60
  ground: Body
  cheetah: Cheetah
  static obs_size = 10
  static act_size = 6

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
    this.reset()
    // ;(this.world.solver as any).tolerance = 0.00001
    // ;(this.world.solver as any).iterations = 1000
  }

  update(torque: CheetahActionSpace) {
    this.world.step(this.fixedTimestep)
    this.cheetah.applyTorque(torque)
    this.reward = this.cheetah.torso.position[0]
  }

  draw() {
    const p = this.p5
    const scale = 180
    p.push()
    p.fill(191)
    p.noStroke()
    p.rect(-p.width/2, -p.height/2, p.width, p.height)
    p.scale(1, -1)
    p.fill(230)
    p.rectMode(p.CORNER)
    p.rect(-p.width/2, -scale, p.width, -scale)
    p.scale(scale, scale)
    p.translate(0, -1)
    const cheetah_x = this.cheetah.torso.position[0]
    p.translate(-cheetah_x, 0)
    p.fill(0)
    const start = Math.floor(cheetah_x)+1
    for (let i=0; i<p.width/100; i+=1) {
      const x = -p.width/(2*scale)+i+start
      let h = 0.2
      if (Math.floor(x)%10 === 0)
        h = 0.4
      if (x-cheetah_x+0.1<p.width/(2*scale))
        p.rect(x, 0, 0.1, -h)
    }
    this.cheetah.draw()
    p.pop()
  }

  getObservation(): CheetahObservationSpace {
    return this.cheetah.getObservation()
  }

  reset(): CheetahObservationSpace {
    super.reset()
    const observation = this.getObservation()
    this.cheetah.reset()
    return observation
  }
}
