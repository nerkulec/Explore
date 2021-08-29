import * as tf from '@tensorflow/tfjs'
import { settingsType } from '../components/types'
import { MyModel } from './Model'

const deepcopy1d = <T>(xs: T[]): T[] => xs.slice()
const deepcopy2d = <T>(xs: T[][]): T[][] => xs.map(deepcopy1d)
const deepcopy3d = <T>(xs: T[][][]): T[][][] => xs.map(deepcopy2d)

const argsort = (elems: number[]) => elems
  .map((e, i) => [e, i])
  .sort(([e1], [e2]) => e1-e2)
  .map(([,i]) => i)

const randomChoice = <T>(elems: T[]): T => {
  return elems[Math.floor(Math.random()*elems.length)]
}

export const permute = <T>(elems: T[], rank: number[]) => {
  const copy: T[] = [...elems]
  for (let i=0; i<elems.length; i++) {
    elems[i] = copy[rank[i]]
  }
}

export const tournamentSelection = (rewards: number[], numElites: number, numSelects: number):
  [number[], [number, number][], number[]] => {
  const rank = argsort(rewards).reverse()
  const n = rewards.length
  const winners = rank.slice(0, numElites)
  const winners_set = new Set(winners)
  const matchups: [number, number][] = []
  while (winners_set.size < numSelects) {
    const a = Math.floor(Math.random()*n)
    const b = Math.floor(Math.random()*n)
    if (rewards[a] > rewards[b]) {
      winners.push(a)
      winners_set.add(a)
      matchups.push([a, b])
    } else {
      winners.push(b)
      winners_set.add(b)
      matchups.push([b, a])
    }
  }
  return [winners, matchups, rank]
}

export const mutate = (model: MyModel, mutation_rate = 0.1) => {
  for (const layer of model.layers) {
    const weights = layer.getWeights()
    for (let i=0; i<weights.length; i++) {
      weights[i] = tf.add(weights[i], tf.randomNormal(weights[i].shape, 0, mutation_rate))
    }
    layer.setWeights(weights)
  }
  model.invalidateMemo()
}

export const crossover = (father: MyModel, mother: MyModel): MyModel => {
  const child = new MyModel(...father.init_args)
  const father_weights = father.getMemoizedWeights()
  const mother_weights = mother.getMemoizedWeights()
  const child_weights = deepcopy3d(father_weights)
  for (let i=0; i<child.layers.length; i++) {
    const father_matrix = father_weights[i]
    const mother_matrix = mother_weights[i]
    const child_matrix = child_weights[i]
    const h = child_matrix.length
    const w = child_matrix[0].length
    for (let k=0; k<w; k++) {
      if (Math.random() < 0.5) {
        for (let y=0; y<h; y++) {
          child_matrix[y][k] = father_matrix[y][k]
        }
      } else {
        for (let y=0; y<h; y++) {
          child_matrix[y][k] = mother_matrix[y][k]
        }
      }
    }
  }
  child.setMemoizedWeights(child_weights)
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
  rewards: number[]
}

export const getEvolutionInfo = (rewards: number[], models: MyModel[],
  {numElites: num_elites, numSelects: num_selects, mutationProb: mutation_prob, numAgents: n_agents, mutateElites: mutate_elites}: settingsType): EvolutionInfo => {
  const [selection, matchups, rank] = tournamentSelection(rewards, num_elites, num_selects)
  const inv_rank = rank.map((_, i) => rank.indexOf(i))
  const elites = selection.slice(0, num_elites)
  const winners = new Set(selection)
  const winnersList = [...winners]
  const losers = models.map((_, i) => i).filter(i => !winners.has(i))
  const parents = [] as [number, number, number][]
  const max_parents_rewards = [] as [number, number][]
  const mutated_rewards = [] as [number, number][]

  for (const loser of losers) {
    const father = randomChoice(winnersList)
    const mother = randomChoice(winnersList)
    parents.push([loser, father, mother])
    max_parents_rewards.push([rank[loser], Math.max(rewards[father], rewards[mother])])
  }

  const mutants: number[] = []
  for (let i=0; i<n_agents; i++) {
    if (mutate_elites || !elites.includes(i)) {
      if (Math.random() < mutation_prob) {
        mutants.push(i)
        mutated_rewards.push([rank[i], rewards[i]])
      }
    }
  }

  return {
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
}
