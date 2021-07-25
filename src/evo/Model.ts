import * as tf from '@tensorflow/tfjs'

export const getModel = (inputDim: number, units: number[]): tf.Sequential => {
  const model = new tf.Sequential()
  model.add(tf.layers.dense({
    inputDim,
    units: units[0],
    activation: units.length === 1 ? 'tanh' : 'relu'
  }))
  for (const [i, num] of units.slice(1).entries()) {
    model.add(tf.layers.dense({
      units: num,
      activation: i === units.length-2 ? 'tanh' : 'relu'
    }))
  }

  return model
}