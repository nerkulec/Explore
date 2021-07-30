import * as tf from '@tensorflow/tfjs'
import { MyModel } from './Model'

const argsort = (elems: number[]) => elems
  .map((e, i) => [e, i])
  .sort(([e1], [e2]) => e1-e2)
  .map(([,i]) => i)

const randomChoice = <T>(elems: T[]): T => {
  return elems[Math.floor(Math.random()*elems.length)]
}

export const tournamentSelection = (rewards: number[], numElites: number): [number[], [number, number][]] => {
  const rank = argsort(rewards)
  const n = rewards.length
  const winners = rank.slice(n-numElites).reverse()
  const matchups: [number, number][] = []
  for (let i=0; i<n-numElites; i++) {
    const a = Math.floor(Math.random()*n)
    const b = Math.floor(Math.random()*n)
    if (rewards[a] > rewards[b]) {
      winners.push(a)
      matchups.push([a, b])
    } else {
      winners.push(b)
      matchups.push([b, a])
    }
  }
  return [winners, matchups]
}

export const mutate = (model: MyModel, mutation_rate = 0.1) => {
  for (const layer of model.layers) {
    const weights = layer.getWeights()
    for (let i=0; i<weights.length; i++) {
      weights[i] = tf.add(weights[i], tf.randomNormal(weights[i].shape, 0, mutation_rate))
    }
    layer.setWeights(weights)
  }
}

// export const copyModel = async (model: MyModel) => {
//   const newModel = await tf.models.modelFromJSON(model.json as any)
//   for (let i=0; i<model.layers.length; i++) {
//     newModel.layers[i].setWeights(model.layers[i].getWeights())
//   }
//   return newModel as MyModel
// }

export const crossover = async (father: MyModel, mother: MyModel): Promise<MyModel> => {
  const child = await tf.models.modelFromJSON(father.json as any) as MyModel
  for (let i=0; i<child.layers.length; i++) {
    const child_weights = child.layers[i].getWeights()
    const child_kernel = child_weights[0].arraySync() as number[][]
    const child_bias = child_weights[1].arraySync() as number[]
    const father_weights = father.layers[i].getWeights()
    const father_kernel = father_weights[0].arraySync() as number[][]
    const father_bias = father_weights[1].arraySync() as number[]
    const mother_weights = mother.layers[i].getWeights()
    const mother_kernel = mother_weights[0].arraySync() as number[][]
    const mother_bias = mother_weights[1].arraySync() as number[]
    for (let k=0; k<child_weights[1].shape[0]; k++) {
      if (Math.random() < 0.5) {
        for (let y=0; y<child_weights[0].shape[0]; y++) {
          child_kernel[y][k] = father_kernel[y][k]
        }
        child_bias[k] = father_bias[k]
      } else {
        for (let y=0; y<child_weights[0].shape[0]; y++) {
          child_kernel[y][k] = mother_kernel[y][k]
        }
        child_bias[k] = mother_bias[k]
      }
    }
    child.layers[i].setWeights([tf.tensor(child_kernel), tf.tensor(child_bias)])
  }
  child.json = father.json
  return child
}

export type EvolutionInfo = {
  elites: number[],
  winners: number[],
  losers: number[],
  matchups: [number, number][]
  parents: [number, number, number][], // child, father, mother
}

export const getEvolutionInfo = (rewards: number[], models: MyModel[], numElites = 4): EvolutionInfo => {
  const [selection, matchups] = tournamentSelection(rewards, numElites)
  const elites = selection.slice(0, numElites)
  const winners = new Set(selection)
  const winnersList = [...winners]
  const losers = models.map((_, i) => i).filter(i => !winners.has(i))
  const parents = [] as [number, number, number][]

  for (const loser of losers) {
    const father = randomChoice(winnersList)
    const mother = randomChoice(winnersList)
    parents.push([loser, father, mother])
  }

  return {
    elites,
    winners: winnersList,
    losers,
    matchups,
    parents
  }
}

// export const evolve = (models: MyModel[], {elites}: EvolutionInfo) => {
  
// }