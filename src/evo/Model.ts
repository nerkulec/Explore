import * as tf from '@tensorflow/tfjs'
import { CheetahGame } from './Game'

export type MyModel = tf.Sequential & {json: string}

export type envString = 'Cheetah'
export const getModel = (env: envString): MyModel => {
  if (env === 'Cheetah') {
    return createModel(CheetahGame.obs_size, [16, CheetahGame.act_size])
  } else {
    throw new Error(`Unrecodnized env name: ${env}`)
  }
}

export const createModel = (inputDim: number, units: number[]): MyModel => {
  const model = new tf.Sequential() as MyModel
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
  model.json = model.toJSON(0, false) as string

  return model
}