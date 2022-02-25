import * as tf from '@tensorflow/tfjs'
import { settingsType } from '../components/types'
import { max_side_limbs, min_length } from './Agent'
import { Game } from './Game'
import { adaptation_dimension, MyModel } from './Model'

const deepcopy1d = <T>(xs: T[]): T[] => xs.slice()
const deepcopy2d = <T>(xs: T[][]): T[][] => xs.map(deepcopy1d)
const deepcopy3d = <T>(xs: T[][][]): T[][][] => xs.map(deepcopy2d)

export const argsort = (elems: number[]) => elems
  .map((e, i) => [e, i])
  .sort(([e1], [e2]) => e1-e2)
  .map(([,i]) => i)

export const argmax = (xs: number[]): number => xs.reduce((best, v, i) => xs[best] >= v ? best : i, 0)

export const randomChoice = <T>(elems: T[]): T => {
  return elems[Math.floor(Math.random()*elems.length)]
}

export const permute = <T>(elems: T[], rank: number[]) => {
  const copy: T[] = [...elems]
  for (let i=0; i<elems.length; i++) {
    elems[i] = copy[rank[i]]
  }
}

export const randn = () => Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(2*Math.PI*Math.random())

export const tournamentSelection = (rewards: number[], numElites: number, numSelects: number, tournamentSize: number):
  [number[], number[][], number[]] => {
  const rank = argsort(rewards).reverse()
  const n = rewards.length
  const winners = rank.slice(0, numElites)
  const winners_set = new Set(winners)
  const matchups: number[][] = []
  const non_broken = rewards.filter(r => isFinite(r) && r !== 0.0).length
  while (winners_set.size < numSelects) {
    const competitors = []
    for (let i=0; i<tournamentSize; i++) {
      competitors.push(Math.floor(Math.random()*n))
    }
    const winner_index = argmax(competitors.map(c => rewards[c]))
    if (!isFinite(rewards[winner_index]) && winners_set.size < non_broken) {
      continue
    }
    const winner = competitors[winner_index]
    competitors.splice(winner_index, 1)
    winners.push(winner)
    winners_set.add(winner)
    matchups.push([winner, ...competitors])
  }
  return [winners, matchups, rank]
}

export const correct_structure = (structure: number[]): number[] => {
  structure = [...structure]
  const new_structure = []
  let n = 1
  let i = 0
  if (structure[0] === 0)
    structure[0] = 1
  while (n>0) {
    if (i >= structure.length) {
      new_structure.push(0)
      i++
      n -= 1
      continue
    }
    new_structure.push(structure[i])
    n += structure[i++]-1
  } // n = 0
  if (new_structure.reduce((s, e) => s+e, 0) !== new_structure.length-1)
    throw new Error("Invalid correction")
  if (new_structure.length-1 > max_side_limbs) {
    new_structure[argmax(new_structure)] -= 1
    return correct_structure(new_structure)
  }
  return new_structure
}

export const mutate = (model: MyModel, {mutationProb,
  tau: tau_coef, tau_0: tau_0_coef}: settingsType) => {
  const d = adaptation_dimension
  const tau_0 = 1/Math.sqrt(2*Math.sqrt(d))*tau_0_coef
  const tau = 1/Math.sqrt(2*d)*tau_coef
  const eps_0 = randn()
  const eps = model.log_sigmas.map(e => randn())
  model.log_sigmas = model.log_sigmas.map((ls, i) => ls += tau*eps[i]+tau_0*eps_0)
  if (model.log_sigmas.some(s => !isFinite(s))) {
    console.log('error')
  }
  const [
    nnl1_s, nnl2_s, tl_s,
    lsi_s, lsd_s, lst_s,
    rsi_s, rsd_s, rst_s, ...rest_s
  ] = model.log_sigmas.map(Math.exp)
  const ll_s = rest_s.slice(0, 8)
  const rl_s = rest_s.slice(8, 16)
  const la_s = rest_s.slice(16, 24)
  const ra_s = rest_s.slice(24, 32)

  for (const [j, layer] of model.layers.entries()) {
    const mut = [nnl1_s, nnl2_s][j]
    const weights = layer.getWeights()
    for (let i=0; i<weights.length; i++) {
      const chosen = tf.less(tf.randomUniform(weights[i].shape), mutationProb)
      weights[i] = tf.add(weights[i], tf.mul(chosen, tf.randomNormal(weights[i].shape, 0, mut)))
    }
    layer.setWeights(weights)
  }
  if (model.graphoid_genotype) {
    let {
      l_structure, r_structure, torso_length,
      l_lengths, r_lengths, l_angles, r_angles
    } = model.graphoid_genotype

    let new_l_structure = [...l_structure]
    for (let i=0; i<new_l_structure.length; i++) {
      if (Math.random() < 0.05*lsi_s/new_l_structure.length) {
        new_l_structure[i] += 1
      } else if (Math.random() < 0.05*lsd_s/new_l_structure.length) {
        new_l_structure[i] = Math.max(0, new_l_structure[i]-1)
      }
    }
    let iter = 0
    while (Math.random() < 0.05*lst_s/new_l_structure.length && iter < 5) {
      const i = Math.floor(Math.random()*new_l_structure.length)
      const j = Math.floor(Math.random()*new_l_structure.length)
      if (i !== j) {
        const t = new_l_structure[i]
        new_l_structure[i] = new_l_structure[j]
        new_l_structure[j] = t
      }
      iter += 1
    }

    let new_r_structure = [...r_structure]
    for (let i=0; i<new_r_structure.length; i++) {
      if (Math.random() < 0.05*rsi_s/new_r_structure.length) {
        new_r_structure[i] += 1
      } else if (Math.random() < 0.05*rsd_s/new_r_structure.length) {
        new_r_structure[i] = Math.max(0, new_r_structure[i]-1)
      }
    }
    iter = 0
    while (Math.random() < 0.05*rst_s/new_r_structure.length && iter < 5) {
      const i = Math.floor(Math.random()*new_r_structure.length)
      const j = Math.floor(Math.random()*new_r_structure.length)
      if (i !== j) {
        const t = new_r_structure[i]
        new_r_structure[i] = new_r_structure[j]
        new_r_structure[j] = t
      }
      iter += 1
    }

    new_l_structure = correct_structure(new_l_structure)
    new_r_structure = correct_structure(new_r_structure)
    const l_n = new_l_structure.length-1
    const r_n = new_r_structure.length-1

    l_lengths = l_lengths.map((l, i) => l * Math.exp(ll_s[i]*randn()/10))
    r_lengths = r_lengths.map((l, i) => l * Math.exp(rl_s[i]*randn()/10))
    l_angles = l_angles.map((a, i) => a + la_s[i]*randn()/10)
    r_angles = r_angles.map((a, i) => a + ra_s[i]*randn()/10)
    const l_d = l_n-l_lengths.length
    const r_d = r_n-r_lengths.length
    if (l_d > 0) {
      for (let i=0; i<l_d; i++) {
        l_lengths.push(Math.exp(randn()/10))
        l_angles.push(Math.PI*(2*Math.random()-1)/2)
      }
    } else if (l_d < 0) {
      l_lengths.splice(l_lengths.length+l_d, -l_d)
      l_angles.splice(l_angles.length+l_d, -l_d)
    }
    if (r_d > 0) {
      for (let i=0; i<r_d; i++) {
        r_lengths.push(Math.exp(randn()/10))
        r_angles.push(Math.PI*(2*Math.random()-1)/2)
      }
    } else if (r_d < 0) {
      r_lengths.splice(r_lengths.length+r_d, -r_d)
      r_angles.splice(r_angles.length+r_d, -r_d)
    }
    const n_left =  new_l_structure.length-1
    const n_right = new_r_structure.length-1
    if (l_lengths.length !== n_left) throw new Error("Invalid genotype")
    if (r_lengths.length !== n_right) throw new Error("Invalid genotype")
    if (l_angles.length !== n_left) throw new Error("Invalid genotype")
    if (r_angles.length !== n_right) throw new Error("Invalid genotype")


    model.graphoid_genotype = {
      l_structure: new_l_structure,
      r_structure: new_r_structure,
      torso_length: Math.min(3, torso_length*Math.exp(tl_s*randn()/10)),
      l_lengths: l_lengths.map(l => Math.max(min_length, Math.min(3, l))),
      r_lengths: r_lengths.map(l => Math.max(min_length, Math.min(3, l))),
      l_angles,
      r_angles,
    }
  }
  model.invalidateMemo()
}

export const crossover = (parents: MyModel[]): MyModel => {
  const child = new MyModel(...parents[0].init_args)
  const parents_weights = parents.map(p => p.getMemoizedWeights())
  const child_weights = deepcopy3d(parents_weights[0])
  for (let i=0; i<child.layers.length; i++) {
    const child_matrix = child_weights[i]
    const h = child_matrix.length
    const w = child_matrix[0].length
    for (let k=0; k<w; k++) {
      const index = Math.floor(parents.length*Math.random())
      for (let y=0; y<h; y++) {
        child_matrix[y][k] = parents_weights[index][i][y][k]
      }
    }
  }
  child.setMemoizedWeights(child_weights)
  if (parents[0].graphoid_genotype) {
    const l_parent = randomChoice(parents)
    const r_parent = randomChoice(parents)
    child.graphoid_genotype = {...l_parent.graphoid_genotype!}
    child.graphoid_genotype.r_structure = r_parent.graphoid_genotype!.r_structure
    child.graphoid_genotype.r_lengths = r_parent.graphoid_genotype!.r_lengths
    child.graphoid_genotype.r_angles = r_parent.graphoid_genotype!.r_angles
    // child.graphoid_genotype = {
    //   l_structure: randomChoice(parents.map(p => p.graphoid_genotype!.l_structure)),
    //   r_structure: randomChoice(parents.map(p => p.graphoid_genotype!.r_structure)),
    //   torso_length: randomChoice(parents.map(p => p.graphoid_genotype!.torso_length)),
    //   // for now assume equal structures
    //   l_angles: randomChoice(parents.map(p => p.graphoid_genotype!.l_angles)),
    //   r_angles: randomChoice(parents.map(p => p.graphoid_genotype!.r_angles)),
    //   l_lengths: randomChoice(parents.map(p => p.graphoid_genotype!.l_lengths)),
    //   r_lengths: randomChoice(parents.map(p => p.graphoid_genotype!.r_lengths))
    // }
    child.log_sigmas = []
    for (let i=0; i<adaptation_dimension; i++) {
      let log_sigma = 0
      for (const parent of parents)
        log_sigma += parent.log_sigmas[i]
      log_sigma /= parents.length
      child.log_sigmas.push(log_sigma)
    }
  }
  // child.mutation_coef = parents.map(p => p.mutation_coef).reduce((a, b)=>a+b, 0)/parents.length
  return child
}

export type EvolutionInfo = {
  elites: number[],
  winners: number[],
  losers: number[],
  matchups: number[][], // winner, ...rest
  parents: number[][], // child, ...parents
  max_parents_rewards: [number, number][],
  mutated_rewards: [number, number][]
  mutants: number[],
  rank: number[],
  inv_rank: number[],
  rewards: number[],
  base_rewards?: number[],
  energy_costs?: number[]
}

export const getEvolutionInfo = (games: Game[], models: MyModel[], {
  numElites, numSelects: num_selects, kappa, numAgents,
  mutateElites: mutate_elites, numParents, tournamentSize, commaVariant}: settingsType): EvolutionInfo => {
  const rewards = games.map(g => g.getReward())
  let base_rewards, energy_costs
  if ((games[0] as any).getBaseReward) {
    base_rewards = (games as any).map((g: any) => g.getBaseReward())
    energy_costs = (games as any).map((g: any) => g.getEnergyCost())
  }
  const [selection, matchups, rank] = tournamentSelection(rewards, numElites, num_selects, tournamentSize)
  const inv_rank = rank.map((_, i) => rank.indexOf(i))
  const elites = selection.slice(0, numElites)
  const winners = new Set(selection)
  const winnersList = [...winners].filter(i => isFinite(rewards[i]))
  const losers = models.map((_, i) => i).filter(i => !winners.has(i))
  const parents = [] as number[][]
  const max_parents_rewards = [] as [number, number][]
  const mutated_rewards = [] as [number, number][]
  let offspring: number[] = []
  if (commaVariant) {
    for (let i=0; i<numAgents; i++) {
      if (!elites.includes(i))
      offspring.push(i)
    }
  } else {
    offspring = losers
  }
  for (const child of offspring) {
    const fathers = []
    let loops = 0
    while (fathers.length < numParents) {
      const father = randomChoice(winnersList)
      if (models[father].generations_since_mutated > kappa && loops < 15) {
        loops += 1
        continue
      }
      fathers.push(father)
    }
    parents.push([child, ...fathers])
    max_parents_rewards.push([rank[child], Math.max(...fathers.map(p => rewards[p]))])
  }

  const mutants: number[] = []
  for (let i=0; i<numAgents; i++) {
    if (mutate_elites || !elites.includes(i)) {
      mutants.push(i)
    }
  }
  for (const i of winnersList) {
    if (mutate_elites || !elites.includes(i)) {
      mutants.push(i)
      mutated_rewards.push([rank[i], rewards[i]])
    }
  }
  const r: EvolutionInfo = {
    elites,
    winners: winnersList,
    losers,
    matchups,
    parents,
    max_parents_rewards,
    mutated_rewards,
    mutants,
    rank,
    inv_rank,
    rewards
  }
  if (base_rewards) {
    r.base_rewards = base_rewards
    r.energy_costs = energy_costs
  }
  return r
}
