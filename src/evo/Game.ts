import { World, Body, Plane } from "p2"
import { P5Instance } from "../components/P5Wrapper"
import { Acrobot, AcrobotActionSpace, AcrobotObservationSpace, Cheetah, CheetahActionSpace, CheetahObservationSpace } from "./Agent"

export interface Game {
  reset(): void
  update(action: number[]): void
  getObservation(): number[]
  draw(...options: any): void
  getReward(): number
  terminated: boolean
}

abstract class PhysicsGame implements Game {
  p5: P5Instance
  terminated = false

  constructor(p5: P5Instance) {
    this.p5 = p5
  }
  reset() {
    this.terminated = false
  }
  abstract getObservation(): number[]
  abstract update(action: number[]): void
  abstract draw(): void
  abstract getReward(): number
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
    this.cheetah.applyTorque(torque)
    this.world.step(this.fixedTimestep)
  }

  draw(draw_background = true) {
    const p = this.p5
    const scale = 180
    p.push()
    p.fill(191)
    p.noStroke()
    if (draw_background)
      p.rect(0, 0, p.width, p.height)
    p.translate(p.width/2, p.height/2)
    p.scale(1, -1)
    p.fill(230)
    p.rectMode(p.CORNER)
    if (draw_background)
      p.rect(-p.width/2, -scale, p.width, -scale)
    p.scale(scale, scale)
    p.translate(0, -1)
    const cheetah_x = this.cheetah.torso.position[0]
    p.translate(-cheetah_x, 0)
    if (draw_background) {
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
    }
    this.cheetah.draw()
    p.pop()
  }

  getObservation(): CheetahObservationSpace {
    return this.cheetah.getObservation()
  }

  getReward() {
    return this.cheetah.torso.position[0]
  }

  reset(): CheetahObservationSpace {
    super.reset()
    const observation = this.getObservation()
    this.cheetah.reset()
    return observation
  }
}

export class AcrobotGame extends PhysicsGame {
  world: World
  fixedTimestep: number = 1/60
  acrobot: Acrobot
  bar_height = 1.5
  max_height_reached = -2
  step = 0
  static obs_size = 4
  static act_size = 1

  constructor(p5: P5Instance) {
    super(p5)
    this.world = new World({
      gravity : [0, -9],
    })
    this.acrobot = new Acrobot(p5)
    this.acrobot.bodies.forEach(b => this.world.addBody(b))
    this.acrobot.constraints.forEach(c => this.world.addConstraint(c))
    this.reset()
  }

  update(torque: AcrobotActionSpace) {
    if (!this.terminated) {
      this.acrobot.applyTorque(torque)
      this.world.step(this.fixedTimestep)
      if (this.acrobot.getHeight() > this.bar_height) {
        this.terminated = true
      }
      this.step += 1
    }
  }

  draw(draw_background=true) {
    const p = this.p5
    const scale = 160
    p.push()
    p.fill(191)
    p.noStroke()
    if (draw_background)
      p.rect(0, 0, p.width, p.height)
    p.fill(191)
    p.noStroke()
    p.translate(p.width/2, p.height/2)
    p.scale(1, -1)
    p.scale(scale)
    p.stroke(0)
    p.strokeWeight(0.01)
    p.line(-1, this.max_height_reached, 1, this.max_height_reached)
    p.noStroke()
    this.acrobot.draw()
    p.pop()
  }

  getObservation(): AcrobotObservationSpace {
    return this.acrobot.getObservation()
  }

  getReward() { // 0-100 for reaching set height + 0-100 for doing it fast
    if (this.terminated) {
      return 200-100*this.step/600
    } else {
      const height = this.acrobot.getHeight()
      this.max_height_reached = Math.min(this.bar_height, Math.max(this.max_height_reached, height))
      return 100*this.max_height_reached/this.bar_height
    }
  }

  reset(): AcrobotObservationSpace {
    super.reset()
    this.max_height_reached = -2
    this.step = 0
    const observation = this.getObservation()
    this.acrobot.reset()
    return observation
  }
}

export const environments = {
  'Cheetah': CheetahGame,
  'Acrobot': AcrobotGame
} as const