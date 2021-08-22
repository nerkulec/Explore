import * as tf from '@tensorflow/tfjs'
import { P5Instance } from '../components/P5Wrapper'
import { CheetahGame } from './Game'

export class MyModel extends tf.Sequential {
  init_args: [number, number[]]
  memoized = false
  memo_weights: number[][][]
  constructor(inputDim: number, units: number[]) {
    super()
    this.init_args = [inputDim, units]
    this.add(tf.layers.dense({
      inputDim,
      units: units[0],
      activation: units.length === 1 ? 'tanh' : 'relu'
    }))
    for (const [i, num] of units.slice(1).entries()) {
      this.add(tf.layers.dense({
        units: num,
        activation: i === units.length-2 ? 'tanh' : 'relu'
      }))
    }
    this.memo_weights = []
  }

  getMemoizedWeights() {
    if (!this.memoized) {
      this.memo_weights = []
      const layers = this.getWeights()
      const n = layers.length/2
      for (let i=0; i<n; i++) {
        const kernel = layers[2*i].arraySync() as number[][]
        const bias = layers[2*i+1].arraySync() as number[]
        this.memo_weights.push([bias, ...kernel])
      }
      this.memoized = true
    }
    return this.memo_weights
  }

  setMemoizedWeights(weights: number[][][]) {
    for (let i=0; i<weights.length; i++) {
      const [bias, ...kernel] = weights[i]
      this.layers[i].setWeights([tf.tensor(kernel), tf.tensor(bias)])
    }
    this.memo_weights = weights
    this.memoized = true
  }
}

export type envString = 'Cheetah'
export const getModel = (env: envString): MyModel => {
  if (env === 'Cheetah') {
    return new MyModel(CheetahGame.obs_size, [16, CheetahGame.act_size])
  } else {
    throw new Error(`Unrecodnized env name: ${env}`)
  }
}

export const drawModel = (p: P5Instance, model: MyModel, matrix = false) => {
  const temp = 1
  const layers = model.getMemoizedWeights()
  const n = layers.length
  for (let i=0; i<n; i++) {
    const weights = layers[i]
    const n_in = weights.length
    const n_out = weights[0].length
    p.push()
    p.strokeWeight(5)
    p.colorMode(p.HSB) // 360, 100, 100, 1
    for (let i_in=0; i_in<n_in; i_in++) {
      for (let i_out=0; i_out<n_out; i_out++) {
        const c = Math.tanh(weights[i_in][i_out]*temp)
        p.stroke(120*(1-c), 100, 100, 0.5) // 0-240 = red-blue
        p.line(p.width*i/n, p.height*i_in/(n_in-1), p.width*(i+1)/n, p.height*i_out/(n_out-1))
      }
    }
    p.pop()
  }
}