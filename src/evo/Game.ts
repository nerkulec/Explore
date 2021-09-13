import { World, Body, Plane } from "p2"
import { P5Instance } from "../components/P5Wrapper"
import { Acrobot, AcrobotActionSpace, AcrobotObservationSpace,
  Cheetah, CheetahActionSpace, CheetahObservationSpace, rotate, add, sub, v2 } from "./Agent"

const limit = (value: number, max: number) => value < -max
  ? -max : value > max ? max : value

const rand = () => Math.random()*2-1

export interface Game {
  reset(): void
  perturb(): void
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
  abstract perturb(): void
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
  static obs_size = 17
  static act_size = 6

  constructor(p5: P5Instance) {
    super(p5)
    this.world = new World({
      gravity : [0, -9*2],
    })
    this.world.defaultContactMaterial.friction = 8
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
    ;(this.world.solver as any).iterations = 5
  }

  update(torque: CheetahActionSpace) {
    this.cheetah.applyTorque(torque)
    this.world.step(this.fixedTimestep)
    this.cheetah.bodies.forEach(b => b.angularVelocity = limit(b.angularVelocity, 4))
    const leg = this.cheetah.bodies[6]
    const leg_lenght = this.cheetah.lengths[2]
    const foot = this.cheetah.bodies[7]
    const foot_length = this.cheetah.lengths[3]
    const leg_v = add(leg.position as v2, rotate([leg_lenght/2, 0], leg.angle))
    const foot_v = add(foot.position as v2, rotate([-foot_length/2, 0], foot.angle))
    foot.position = add(foot.position as v2,  sub(leg_v, foot_v))
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

  perturb(): void {
    this.cheetah.bodies.forEach(b => b.angularVelocity += rand()*0.1)
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

  perturb(): void {
    this.acrobot.bodies.forEach(b => b.angularVelocity += rand())
  }
}

const range = (start: number, stop: number, step: number) =>
  Array.from({length: (stop-start)/step+1}, (_, i) => start+(i*step))

export type MountainCarActionSpace = [number]
export type MountainCarObservationSpace = [number, number]

export class MountainCarGame implements Game {
  x = -0.5
  vx = 0
  fuel_used = 0
  max_height_reached: number
  p5: P5Instance
  terminated = false
  static goal = 0.45
  static goal_height = Math.sin(3*0.45) * 0.45 + 0.55
  static min_height = 0.1
  static max_height = 1
  static height = MountainCarGame.max_height-MountainCarGame.min_height
  static height_diff = MountainCarGame.goal_height-MountainCarGame.min_height
  static min_pos = -1.2
  static max_pos = 0.6
  static width = MountainCarGame.max_pos-MountainCarGame.min_pos
  static max_speed = 0.07
  static power = 0.0015*0.5
  static obs_size = 2
  static act_size = 1

  static xs = range(MountainCarGame.min_pos, MountainCarGame.max_pos, 0.05)
  static ys = MountainCarGame.xs.map(MountainCarGame.heightFn)

  constructor(p5: P5Instance) {
    this.p5 = p5
    this.max_height_reached = MountainCarGame.min_height
    this.reset()
  }

  update([force]: MountainCarActionSpace) {
    if (!this.terminated) {
      this.fuel_used += force*force*0.1
      this.vx += force * MountainCarGame.power - 0.0025 * Math.cos(3 * this.x)
      if (this.vx > MountainCarGame.max_speed) {
        this.vx = MountainCarGame.max_speed
      } else if (this.vx < -MountainCarGame.max_speed) {
        this.vx = -MountainCarGame.max_speed
      }
      this.x += this.vx
      if (this.x > MountainCarGame.max_pos) {
        this.x = MountainCarGame.max_pos
      } else if (this.x < MountainCarGame.min_pos) {
        this.x = MountainCarGame.min_pos
        if (this.vx < 0) {
          this.vx = 0
        }
      }
      this.terminated = this.x >= MountainCarGame.goal
      const height = this.getHeight()
      if (this.x>-0.5 && height > this.max_height_reached) {
        this.max_height_reached = Math.min(height, MountainCarGame.goal_height)
      }
    }
  }

  getObservation(): MountainCarObservationSpace {
    return [this.x, this.vx]
  }

  static heightFn(x: number) {
    return Math.sin(x*3) * 0.45 + 0.55
  }

  getHeight(): number {
    return MountainCarGame.heightFn(this.x)
  }

  getReward() { // 0-100 for reaching height + 0-100 for saving fuel
    if (this.terminated) {
      return 200-100*this.fuel_used/60
    } else {
      return 100*(this.max_height_reached-MountainCarGame.min_height)/MountainCarGame.height_diff
    }
  }

  reset(): MountainCarObservationSpace {
    const observation = this.getObservation()
    this.terminated = false
    this.x = -0.5
    this.vx = 0
    this.fuel_used = 0
    this.max_height_reached = MountainCarGame.min_height
    return observation
  }

  perturb(): void {
    this.vx += rand()*0.01
  }

  draw(draw_background=true) {
    const p = this.p5
    const {width, height, min_pos, max_height, xs, ys} = MountainCarGame
    p.push()
    p.fill(191)
    p.noStroke()
    if (draw_background)
      p.rect(0, 0, p.width, p.height)
    p.scale(1, -1)
    p.scale(p.width/width/0.973, p.height/(height+0.1)/1.11)
    p.translate(-min_pos, -max_height-0.11)
    if (draw_background) {
      p.fill(127)
      p.beginShape()
      const n = xs.length
      for (let i=0; i<n; i++) {
        p.vertex(xs[i], ys[i])
      }
      for (let i=0; i<n; i++) {
        p.vertex(xs[n-i-1], 0)
      }
      p.endShape()
    }
    p.fill(63)
    p.rectMode(p.CENTER)
    const clearance = 0.1
    p.translate(this.x, this.getHeight()+clearance)
    p.rotate(Math.cos(3*this.x))
    p.rect(0, 0, 0.25, 0.12)
    p.fill(0)
    p.circle(-0.1, -0.05, 0.08)
    p.circle( 0.1, -0.05, 0.08)
    p.pop()
  }
}

export const environments = {
  'Cheetah': CheetahGame,
  'Acrobot': AcrobotGame,
  'Mountain car': MountainCarGame
} as const