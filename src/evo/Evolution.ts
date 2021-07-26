import * as tf from '@tensorflow/tfjs'

const argsort = (elems: number[]) => elems
  .map((e, i) => [e, i])
  .sort(([e1], [e2]) => e1-e2)
  .map(([,i]) => i)

export const tournamentSelection = (rewards: number[], elites: number): number[] => {
  const rank = argsort(rewards)
  const n = rewards.length
  const winners = rank.slice(n-elites)
  for (let i=0; i<n-elites; i++) {
    const a = Math.floor(Math.random()*n)
    const b = Math.floor(Math.random()*n)
    if (rewards[a] > rewards[b]) {
      winners.push(a)
    } else {
      winners.push(b)
    }
  }
  return winners.sort((a, b) => rewards[b]-rewards[a])
}

export const mutate = (model: tf.Sequential, mutation_rate = 0.1) => {
  for (const layer of model.layers) {
    const weights = layer.getWeights()
    for (let i=0; i<weights.length; i++) {
      weights[i] = tf.add(weights[i], tf.randomNormal(weights[i].shape, 0, mutation_rate))
    }
    layer.setWeights(weights)
  }
}

export const copyModel = async (model: tf.Sequential) => {
  const modelConf = model.toJSON(0, false)
  const newModel = await tf.models.modelFromJSON(modelConf as any)
  for (let i=0; i<model.layers.length; i++) {
    newModel.layers[i].setWeights(model.layers[i].getWeights())
  }
  return newModel as tf.Sequential
}

export const evolution = async (rewards: number[], models: tf.Sequential[], elites = 4) => {
  const winners = tournamentSelection(rewards, elites).map(i => copyModel(models[i]))
  // const offspring = [...new Set(winners)]
  for (let i=0; i<models.length; i++) {
    models[i] = await winners[i]
    if (i>=elites) {
      mutate(models[i])
    }
  }
}