import { P5Instance } from '../components/P5Wrapper'
import { Capsule, Body, RotationalSpring, RevoluteConstraint, Circle, vec2 } from 'p2'
import { correct_structure, randn, randomChoice } from './Evolution'

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

export const drawBody = (p: P5Instance, body: Body) => {
  p.push()
  p.rectMode(p.CENTER)
  p.translate(...body.position as v2)
  p.rotate(body.angle)
  for (const shape of body.shapes){
    if (shape instanceof Capsule) {
      p.fill(127)
      if ((p as any)._renderer.drawingContext instanceof WebGLRenderingContext) {
        p.fill(0)
        p.rect(0, 0, shape.length+2*shape.radius, 2*shape.radius)
      } else {
        p.rect(0, 0, shape.length+2*shape.radius, 2*shape.radius, shape.radius)
      }
    }
    if (shape instanceof Circle) {
      p.fill(230)
      p.circle(0, 0, shape.radius)
    }
  }
  p.pop()
}
export type v2 = [number, number]
export const add = ([x1, y1]: v2, [x2, y2]: v2): v2 => [x1+x2, y1+y2]
export const sub = ([x1, y1]: v2, [x2, y2]: v2): v2 => [x1-x2, y1-y2]
export const sum = (xs: number[]): number => xs.reduce((s, x) => s+x, 0)
export const rotate = ([x, y]: v2, angle: number): v2 => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [x*c-y*s, x*s+y*c]
}
// x = x*cosβ x − y*sinβ
// y = x*sinβ x + y*cosβ
 

export type CheetahActionSpace = [number, number, number, number, number, number]
export type CheetahObservationSpace = [
  number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number, number, number
]

export class Cheetah extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  springs: RotationalSpring[]
  torso: Body
  rleg: [Body, Body, Body]
  fleg: [Body, Body, Body]
  head: Body
  torque_scale: number = 50
  torque_coefs: CheetahActionSpace = [3, 1.5, 1, 1.5, 1.5, 0.2]
  lengths: [number, number, number, number]
  rleg_joints: [Body, Body, Body, Body]
  fleg_joints: [Body, Body, Body, Body]
  rleg_angles: [number, number, number]
  fleg_angles: [number, number, number]
  starting_positions: v2[]

  constructor(p5: P5Instance) {
    super(p5)
    const length = 2.40
    const height = 2.40
    const margin = 0.10
    const start_y = 1.50
    const leg_height = height/3
    this.bodies = []
    this.constraints = []
    this.springs = []
    const torso_shape = new Capsule({length, radius: margin})
    this.torso = new Body({mass: length*2, position : [0, start_y]})
    this.torso.addShape(torso_shape)
    const head_shape = new Capsule({length: leg_height, radius: margin})
    this.head = new Body({mass: 0.01, position : [length/2+leg_height/2, start_y]})
    this.head.addShape(head_shape)
    this.rleg = [] as any
    this.fleg = [] as any
    this.lengths = [length, leg_height, leg_height, leg_height/2]
    const positions = [0.5*leg_height, 1.5*leg_height, 2.25*leg_height]
    this.rleg_angles = [2.42, -Math.PI/2, Math.PI/2]
    this.fleg_angles = [-2.2, Math.PI/1.8, 0]
    const rleg_shapes = []
    const fleg_shapes = []
    for (let i=1; i<4; i++) {
      rleg_shapes.push(new Capsule({length: this.lengths[i], radius: margin}))
      fleg_shapes.push(new Capsule({length: this.lengths[i], radius: margin}))
    }
    for (let i=0; i<3; i++) {
      this.rleg.push(new Body({mass: this.lengths[i], position: [-length/2-positions[i], start_y]}))
      this.fleg.push(new Body({mass: this.lengths[i], position: [ length/2+positions[i], start_y]}))
      this.rleg[i].addShape(rleg_shapes[i])
      this.fleg[i].addShape(fleg_shapes[i])
    }
    this.rleg_joints = [this.torso, ...this.rleg]
    this.fleg_joints = [this.torso, ...this.fleg]
    // springs
    const stiffness = 150
    const damping = 0.9
    for (let i=0; i<3; i++) {
      this.springs.push(new RotationalSpring(
        this.rleg_joints[i], this.rleg_joints[i+1], {
        restAngle: this.rleg_angles[i],
        stiffness, damping
      }))
      this.springs.push(new RotationalSpring(
        this.fleg_joints[i], this.fleg_joints[i+1], {
        restAngle: this.fleg_angles[i],
        stiffness, damping
      }))
    }
    this.springs.push(new RotationalSpring(
      this.torso, this.head, {
      restAngle: 0.5,
      stiffness, damping
    }))
    // constraints
    for (let i=0; i<3; i++) {
      this.constraints.push(new RevoluteConstraint(
        this.rleg_joints[i], this.rleg_joints[i+1], {
        localPivotA: [-this.lengths[i]/2, 0],
        localPivotB: [this.lengths[i+1]/2, 0],
        collideConnected: false
      }))
      this.constraints.push(new RevoluteConstraint(
        this.fleg_joints[i], this.fleg_joints[i+1], {
        localPivotA: [this.lengths[i]/2, 0],
        localPivotB: [-this.lengths[i+1]/2, 0],
        collideConnected: false
      }))
    }
    this.constraints.push(new RevoluteConstraint(
      this.torso, this.head, {
      localPivotA: [length/2, 0],
      localPivotB: [-leg_height/2, 0],
      collideConnected: false
    }))
    this.bodies.push(this.torso, this.head, ...this.rleg, ...this.fleg)
    this.starting_positions = this.bodies.map(body => [...body.position as v2])
  }

  reset() {
    // leg placement
    for (let i=0; i<this.bodies.length; i++) {
      const body = this.bodies[i]
      body.position = [...this.starting_positions[i]]
      body.previousPosition = [...this.starting_positions[i]]
      body.angle = 0
      body.previousAngle = 0
      body.velocity = [0, 0]
      body.angularVelocity = 0
      body.vlambda = vec2.create()
      body.wlambda = 0 as any
      body.force = vec2.create()
      body.angularForce = 0
    }
    for (let i=0; i<3; i++) {
      const rleg_preankle = this.rleg_joints[i].position as v2
      const rleg_postankle = this.rleg_joints[i+1].position as v2
      const rleg_pre_pivot: v2 = [-this.lengths[i]/2, 0]
      const rleg_post_pivot: v2 = [this.lengths[i+1]/2, 0]
      const fleg_preankle = this.fleg_joints[i].position as v2
      const fleg_postankle = this.fleg_joints[i+1].position as v2
      const fleg_pre_pivot: v2 = [this.lengths[i]/2, 0]
      const fleg_post_pivot: v2 = [-this.lengths[i+1]/2, 0]
      vec2.rotate(rleg_post_pivot, rleg_post_pivot, sum(this.rleg_angles.slice(0, i+1)))
      vec2.rotate(rleg_pre_pivot, rleg_pre_pivot, sum([0, ...this.rleg_angles].slice(0, i+1)))
      vec2.rotate(fleg_post_pivot, fleg_post_pivot, sum(this.fleg_angles.slice(0, i+1)))
      vec2.rotate(fleg_pre_pivot, fleg_pre_pivot, sum([0, ...this.fleg_angles].slice(0, i+1)))
      const rleg_delta = sub(add(rleg_preankle, rleg_pre_pivot), add(rleg_postankle, rleg_post_pivot))
      const fleg_delta = sub(add(fleg_preankle, fleg_pre_pivot), add(fleg_postankle, fleg_post_pivot))
      const rleg_pos = this.rleg[i].position
      const fleg_pos = this.fleg[i].position
      vec2.add(rleg_pos, rleg_pos, rleg_delta)
      vec2.add(fleg_pos, fleg_pos, fleg_delta)
      for (let j=i; j<3; j++) {
        this.rleg[j].angle += this.rleg_angles[i]
        this.fleg[j].angle += this.fleg_angles[i]
      }
    }
  }

  getObservation(): CheetahObservationSpace {
    return [
      // Math.cos(2*Math.PI*this.torso.position[0]/10),
      // Math.sin(2*Math.PI*this.torso.position[0]/10),
      this.torso.position[1],
      this.torso.angle,
      this.rleg[0].angle - this.torso.angle,
      this.rleg[1].angle-this.rleg[0].angle,
      this.rleg[2].angle-this.rleg[1].angle,
      this.fleg[0].angle - this.torso.angle,
      this.fleg[1].angle-this.fleg[0].angle,
      this.fleg[2].angle-this.fleg[1].angle,
      this.torso.velocity[0],
      this.torso.velocity[1],
      this.torso.angularVelocity,
      this.rleg[0].angularVelocity - this.torso.angularVelocity,
      this.rleg[1].angularVelocity-this.rleg[0].angularVelocity,
      this.rleg[2].angularVelocity-this.rleg[1].angularVelocity,
      this.fleg[0].angularVelocity - this.torso.angularVelocity,
      this.fleg[1].angularVelocity-this.fleg[0].angularVelocity,
      this.fleg[2].angularVelocity-this.fleg[1].angularVelocity,
    ]
  }

  applyTorque(torque: CheetahActionSpace) {
    const limbs_a = [this.rleg[0], this.rleg[1], this.rleg[2], this.fleg[0], this.fleg[1], this.fleg[2]]
    const limbs_b = [this.torso,   this.rleg[0], this.rleg[1], this.torso,   this.fleg[0], this.fleg[1]]
    for (let i=0; i<6; i++) {
      limbs_a[i].angularForce += torque[i]*this.torque_scale*this.torque_coefs[i]
      limbs_b[i].angularForce -= torque[i]*this.torque_scale*this.torque_coefs[i]
    }
  }

  draw() {
    for (const body of this.bodies) {
      drawBody(this.p5, body)
    }
  }
}

const subtree_size = (structure: number[], i: number): number => {
  let n = 1
  const initial_i = i
  while (n>0) {
    n += structure[i++]-1
  }
  return i-initial_i
}

const direct_descendants = <T>(structure: number[], elements: T[]): [T, T][] => {
  if (structure.length !== elements.length) throw new Error("Invalid arguments")
  const descendants: [T, T][] = []
  for (let parent=0; parent<structure.length; parent++) {
    const n = structure[parent]
    let child = parent+1
    for (let i=0; i<n; i++) {
      descendants.push([elements[parent], elements[child]])
      child += subtree_size(structure, child)
    }
  }
  return descendants
}

export type GraphoidActionSpace = number[]
export type GraphoidObservationSpace = number[]

export const max_side_limbs = 8
export const max_n_limbs = 2*max_side_limbs+1 // 8 for each side

export type GraphoidGenotype = {
  l_structure: number[]
  r_structure: number[]
  torso_length: number
  l_lengths: number[]
  r_lengths: number[]
  l_angles: number[]
  r_angles: number[]
}

const tau = 2*Math.PI
export const min_length = 0.8
export const get_random_graphoid = (): GraphoidGenotype => {
  const torso_length = 3*Math.exp(randn()/3)
  let l_structure: number[] = []
  let r_structure: number[] = []
  const l_lengths: number[] = []
  const r_lengths: number[] = []
  const l_angles: number[]= []
  const r_angles: number[]= []

  let l_n = Math.random()*3
  l_structure.push(randomChoice([1, 2, 3]))
  for (let i=0; i<l_n; i++) {
    const a = randomChoice([0, 1, 2])
    const b = randomChoice([0, 1, 2])
    l_structure.push(Math.min(a, b))
  }
  l_structure = correct_structure(l_structure)
  l_n = l_structure.length-1

  let r_n = Math.random()*3
  r_structure.push(randomChoice([1, 2, 3]))
  for (let i=0; i<r_n; i++) {
    const a = randomChoice([0, 1, 2])
    const b = randomChoice([0, 1, 2])
    r_structure.push(Math.min(a, b))
  }
  r_structure = correct_structure(r_structure)
  r_n = r_structure.length-1

  for (let i=0; i<l_n; i++) {
    l_lengths.push(Math.exp(randn()/3))
    l_angles.push(Math.PI*(2*Math.random()-1)/2)
  }

  for (let i=0; i<r_n; i++) {
    r_lengths.push(Math.exp(randn()/3))
    r_angles.push(Math.PI*(2*Math.random()-1)/2)
  }

  return {
    l_structure, r_structure, torso_length,
    l_lengths: l_lengths.map(l => Math.max(min_length, Math.min(3, l))),
    r_lengths: r_lengths.map(l => Math.max(min_length, Math.min(3, l))),
    l_angles, r_angles
  }
  // return {
  //   l_structure: [1, 0],
  //   r_structure: [1, 0],
  //   torso_length: 1,
  //   l_lengths: [1],
  //   r_lengths: [1],
  //   l_angles: [tau/4],
  //   r_angles: [-tau/4]
  // }
}

export class Graphoid extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  springs: RotationalSpring[]
  torque_scale: number = 25
  l_structure: number[]
  r_structure: number[]
  l_lengths: number[]
  r_lengths: number[]
  torso_length: number
  l_angles: number[]
  r_angles: number[]
  starting_positions: v2[]
  starting_angles: number[]
  torso: Body
  l_bodies: Body[]
  r_bodies: Body[]
  l_pairs: [Body, Body][]
  r_pairs: [Body, Body][]
  genotype: GraphoidGenotype
  length_coef: number
  energy_used: number
  max_vel_achieved: number
  dead: boolean

  constructor(p5: P5Instance, genotype: GraphoidGenotype) {
    super(p5)
    this.genotype = genotype
    const {
      l_structure, r_structure,
      torso_length, l_lengths, r_lengths,
      l_angles, r_angles
    } = genotype
    const n_left = l_structure.length-1
    const n_right = r_structure.length-1
    if (l_lengths.length !== n_left) throw new Error("Invalid genotype")
    if (r_lengths.length !== n_right) throw new Error("Invalid genotype")
    if (l_angles.length !== n_left) throw new Error("Invalid genotype")
    if (r_angles.length !== n_right) throw new Error("Invalid genotype")
    this.dead = false
    const length_coef = 0.8
    this.length_coef = length_coef
    const start_y = 1.50
    const margin = 0.1
    this.bodies = []
    this.l_bodies = []
    this.r_bodies = []
    this.constraints = []
    this.springs = []
    this.torso_length = torso_length
    this.l_lengths = l_lengths
    this.r_lengths = r_lengths
    this.l_angles = l_angles
    this.r_angles = r_angles
    this.l_structure = l_structure
    this.r_structure = r_structure
    this.energy_used = 0
    this.max_vel_achieved = 0

    const torso_shape = new Capsule({
      length: length_coef*torso_length, radius: margin,
      collisionGroup: 2, collisionMask: 1
    })
    this.torso = new Body({
      mass: torso_length, position: [0, start_y]
    })
    this.torso.addShape(torso_shape)
    
    const l_shapes = l_lengths.map(l => new Capsule({
      length: length_coef*l, radius:margin,
      collisionGroup: 2, collisionMask: 1
    }))
    const r_shapes = r_lengths.map(l => new Capsule({
      length: length_coef*l, radius:margin,
      collisionGroup: 2, collisionMask: 1
    }))
    
    const l_positions = l_shapes.map(s => -length_coef*torso_length/2-margin)
    for (let i=0; i<n_left; i++) { // i - index of limb in l_lengths
      const n = subtree_size(l_structure, i+1)
      const l = l_lengths[i]*length_coef
      for (let j=i+1; j<i+1+n; j++) {
        l_positions[j] -= l
      }
      l_positions[i] -= l/2
    }
    for (let i=0; i<n_left; i++) {
      const body = new Body({
        mass: l_lengths[i], position: [l_positions[i], start_y]
      })
      body.addShape(l_shapes[i])
      this.l_bodies.push(body)
    }
    
    const r_positions = r_shapes.map(s => length_coef*torso_length/2+margin)
    for (let i=0; i<n_right; i++) {
      const n = subtree_size(r_structure, i+1)
      const l = r_lengths[i]*length_coef
      for (let j=i+1; j<i+1+n; j++) {
        r_positions[j] += l
      }
      r_positions[i] += l/2
    }
    for (let i=0; i<n_right; i++) {
      const body = new Body({
        mass: r_lengths[i], position: [r_positions[i], start_y]
      })
      body.addShape(r_shapes[i])
      this.r_bodies.push(body)
    }
    this.l_pairs = direct_descendants(l_structure, [this.torso, ...this.l_bodies])
    this.r_pairs = direct_descendants(r_structure, [this.torso, ...this.r_bodies])
    // springs
    const stiffness = 150
    const damping = 0.5
    // const l_angles_descendant_order = direct_descendants(l_structure, [0, ...l_angles])
    //   .map(([l, r]) => r)
    // const r_angles_descendant_order = direct_descendants(r_structure, [0, ...r_angles])
    //   .map(([l, r]) => r)

    this.l_pairs.forEach(([l, r], i) => this.springs.push(new RotationalSpring(
      l, r, {restAngle: l_angles[i], stiffness, damping} // angles not in order
    )))
    this.r_pairs.forEach(([l, r], i) => this.springs.push(new RotationalSpring(
      l, r, {restAngle: r_angles[i], stiffness, damping}
    )))
    this.l_pairs.forEach(([l, r]) => this.constraints.push(
      new RevoluteConstraint(l, r, {
        localPivotA: [-l.mass*length_coef/2, 0], localPivotB: [r.mass*length_coef/2, 0], collideConnected: false
      }
    )))
    this.r_pairs.forEach(([l, r]) => this.constraints.push(
      new RevoluteConstraint(l, r, {
        localPivotA: [l.mass*length_coef/2, 0], localPivotB: [-r.mass*length_coef/2, 0], collideConnected: false
      }
    )))
    this.bodies = [this.torso, ...this.l_bodies, ...this.r_bodies]
    // this.setAngles()
    this.positionBodies()
    this.starting_positions = this.bodies.map(body => [...body.position as v2])
    this.starting_angles = this.bodies.map(body => body.angle)
  }

  setAngles() {
    const l_summed_angles = this.l_angles.map(s => 0)
    for (let i=0; i<this.l_angles.length; i++) {
      const n = subtree_size(this.l_structure, i+1)
      const a = this.l_angles[i]
      for (let j=i+1; j<i+1+n; j++) {
        l_summed_angles[j] += a
      }
    }
    const r_summed_angles = this.r_angles.map(s => 0)
    for (let i=0; i<this.r_angles.length; i++) {
      const n = subtree_size(this.r_structure, i+1)
      const a = this.r_angles[i]
      for (let j=i+1; j<i+1+n; j++) {
        r_summed_angles[j] += a
      }
    }
    this.l_bodies.forEach((b, i) => b.angle = l_summed_angles[i])
    this.r_bodies.forEach((b, i) => b.angle = r_summed_angles[i])
    this.l_bodies.forEach((b, i) => b.previousAngle = l_summed_angles[i])
    this.r_bodies.forEach((b, i) => b.previousAngle = r_summed_angles[i])
  }

  positionBodies() {
    const lc = this.length_coef
    const offset = vec2.create()
    this.r_pairs.forEach(([l, r]) => {
      const l_pivot = [l.mass*lc/2, 0]
      vec2.rotate(l_pivot, l_pivot, l.angle)
      vec2.add(l_pivot, l_pivot, l.position)
      const r_pivot = [-r.mass*lc/2, 0]
      vec2.rotate(r_pivot, r_pivot, r.angle)
      vec2.add(r_pivot, r_pivot, r.position)
      const diff = vec2.create()
      vec2.negate(r_pivot, r_pivot)
      vec2.add(diff, l_pivot, r_pivot)
      vec2.add(r.position, r.position, diff)
      vec2.scale(diff, diff, r.mass)
      vec2.add(offset, offset, diff)
    })
    this.l_pairs.forEach(([l, r]) => {
      const l_pivot = [-l.mass*lc/2, 0]
      vec2.rotate(l_pivot, l_pivot, l.angle)
      vec2.add(l_pivot, l_pivot, l.position)
      const r_pivot = [r.mass*lc/2, 0]
      vec2.rotate(r_pivot, r_pivot, r.angle)
      vec2.add(r_pivot, r_pivot, r.position)
      const diff = vec2.create()
      vec2.negate(r_pivot, r_pivot)
      vec2.add(diff, l_pivot, r_pivot)
      vec2.add(r.position, r.position, diff)
      vec2.scale(diff, diff, r.mass)
      vec2.add(offset, offset, diff)
    })
    // vec2.negate(offset, offset)
    // vec2.scale(offset, offset, 1/this.bodies.reduce((s, b) => s+b.mass, 0))
    // this.bodies.forEach(b => vec2.add(b.position, b.position, offset))
  }

  reset() {
    // leg placement
    for (let i=0; i<this.bodies.length; i++) {
      const body = this.bodies[i]
      body.position = [...this.starting_positions[i]]
      body.previousPosition = [...this.starting_positions[i]]
      body.angle = this.starting_angles[i]
      body.previousAngle = 0
      body.velocity = [0, 0]
      body.angularVelocity = 0
      body.vlambda = vec2.create()
      body.wlambda = 0 as any
      body.force = vec2.create()
      body.angularForce = 0
    }
    this.energy_used = 0
    this.max_vel_achieved = 0
    this.dead = false
  }

  getObservation(): GraphoidObservationSpace {
    const obs: number[] = []
    const zeros_left = max_side_limbs-this.l_bodies.length
    const zeros_right = max_side_limbs-this.r_bodies.length
    obs.push(this.torso.position[1], ...this.torso.velocity) //3 elements
    obs.push(this.torso.angle, this.torso.angularVelocity) //2 elements
    obs.push(...this.l_bodies.map(b => b.angle))
    for (let i=0; i<zeros_left; i++) obs.push(0)
    obs.push(...this.l_bodies.map(b => b.angularVelocity))
    for (let i=0; i<zeros_left; i++) obs.push(0)
    obs.push(...this.r_bodies.map(b => b.angle))
    for (let i=0; i<zeros_right; i++) obs.push(0)
    obs.push(...this.r_bodies.map(b => b.angularVelocity))
    for (let i=0; i<zeros_right; i++) obs.push(0)
    return obs
  }

  applyTorque(torque: GraphoidActionSpace) {
    // Attention! torque depends on mass of FIRST limb
    for (const [i, [limb_a, limb_b]] of this.l_pairs.entries()) {
      limb_a.angularForce += torque[i]*limb_a.mass*this.torque_scale
      limb_b.angularForce -= torque[i]*limb_a.mass*this.torque_scale
    }
    for (const [i, [limb_a, limb_b]] of this.r_pairs.entries()) {
      limb_a.angularForce += torque[i+8]*limb_a.mass*this.torque_scale
      limb_b.angularForce -= torque[i+8]*limb_a.mass*this.torque_scale
    }
    // this.energy_used += [...this.l_pairs, ...this.r_pairs]
    //   .reduce((s, [l, r]) => s+(l.angularVelocity-r.angularVelocity)**2, 0)
    this.energy_used += this.bodies.reduce((s, b) => s+(b.angle-b.previousAngle)**2, 0)
    this.max_vel_achieved = Math.max(this.max_vel_achieved, vec2.length(this.torso.velocity))
    if (this.bodies.some(b => Math.abs(b.angle-b.previousAngle) > tau/3)) this.dead = true
  }

  draw() {
    for (const body of this.bodies) {
      drawBody(this.p5, body)
    }
  }
}


export type AcrobotActionSpace = [number]
export type AcrobotObservationSpace = [number, number, number, number]

export class Acrobot extends PhysicsAgent {
  bodies: Body[]
  constraints: RevoluteConstraint[]
  torque_scale: number = 1.5
  starting_positions: v2[]

  constructor(p5: P5Instance) {
    super(p5)
    const length = 1
    const margin = 0.10
    this.bodies = []
    this.constraints = []
    const shapes = [
      new Capsule({length, radius: margin}),
      new Capsule({length, radius: margin})
    ]
    this.bodies = [
      new Body({mass: 0, position: [0, 0]}),
      new Body({mass: length, position : [length*0.5, 0]}),
      new Body({mass: length, position : [length*1.5, 0]}),
    ]
    this.bodies[1].addShape(shapes[0])
    this.bodies[2].addShape(shapes[1])
    // constraints
    this.constraints.push(new RevoluteConstraint(
      this.bodies[0], this.bodies[1], {
      worldPivot: [0, 0],
      collideConnected: false
    }))
    this.constraints.push(new RevoluteConstraint(
      this.bodies[1], this.bodies[2], {
      worldPivot: [length, 0],
      collideConnected: false
    }))
    this.bodies[1].position = [0, -length*0.5]
    this.bodies[2].position = [0, -length*1.5]
    this.starting_positions = this.bodies.map(body => [...body.position as v2])
  }

  reset() {
    for (let i=0; i<this.bodies.length; i++) {
      const body = this.bodies[i]
      body.position = [...this.starting_positions[i]]
      body.previousPosition = [...this.starting_positions[i]]
      body.angle = -Math.PI/2
      body.previousAngle = -Math.PI/2
      body.velocity = [0, 0]
      body.angularVelocity = 0
      body.vlambda = vec2.create()
      body.wlambda = 0 as any
      body.force = vec2.create()
      body.angularForce = 0
    }
  }

  getObservation(): AcrobotObservationSpace {
    return [
      this.bodies[1].angle,
      this.bodies[2].angle,
      this.bodies[1].angularVelocity,
      this.bodies[2].angularVelocity
    ]
  }

  getHeight(): number {
    return Math.sin(this.bodies[1].angle) + Math.sin(this.bodies[2].angle)
  }

  applyTorque([torque]: AcrobotActionSpace) {
    this.bodies[1].angularForce += torque*this.torque_scale
    this.bodies[2].angularForce -= torque*this.torque_scale
  }

  draw() {
    for (const body of this.bodies) {
      drawBody(this.p5, body)
    }
  }
}
