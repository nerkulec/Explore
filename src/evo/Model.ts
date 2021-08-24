import * as tf from '@tensorflow/tfjs'
import { Graphics } from 'p5'
import { P5Instance } from '../components/P5Wrapper'
import { CheetahGame } from './Game'

export class MyModel extends tf.Sequential {
  init_args: [P5Instance, number, number[]]
  p: P5Instance
  memo_weights?: number[][][]
  memo_g?: Graphics
  constructor(p: P5Instance, inputDim: number, units: number[]) {
    super()
    this.p = p
    this.init_args = [p, inputDim, units]
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
    this.invalidateMemo()
  }

  getMemoizedWeights() {
    if (!this.memo_weights) {
      this.memo_weights = []
      const layers = this.getWeights()
      const n = layers.length/2
      for (let i=0; i<n; i++) {
        const kernel = layers[2*i].arraySync() as number[][]
        const bias = layers[2*i+1].arraySync() as number[]
        this.memo_weights.push([bias, ...kernel])
      }
    }
    return this.memo_weights
  }

  setMemoizedWeights(weights: number[][][]) {
    for (let i=0; i<weights.length; i++) {
      const [bias, ...kernel] = weights[i]
      this.layers[i].setWeights([tf.tensor(kernel), tf.tensor(bias)])
    }
    this.memo_weights = weights
  }

  invalidateMemo() {
    this.memo_weights = undefined
    this.memo_g = undefined
  }

  draw(matrix=false) {
    const temp = 0.1
    const layers = this.getMemoizedWeights()
    const n = layers.length
    if (!this.memo_g) {
      this.memo_g = this.p.createGraphics(this.p.width, this.p.height)
      this.memo_g.translate(this.memo_g.width*0.05, this.memo_g.height*0.05)
      this.memo_g.scale(0.9, 0.9)
      for (let i=0; i<n; i++) {
        const weights = layers[i]
        const n_in = weights.length
        const n_out = weights[0].length
        this.memo_g.strokeWeight(8)
        this.memo_g.colorMode(this.memo_g.HSB) // 360, 100, 100, 1
        for (let i_in=1; i_in<n_in; i_in++) {
          for (let i_out=0; i_out<n_out; i_out++) {
            const c = Math.tanh(weights[i_in][i_out]*temp) // c \in (-1, 1)
            this.memo_g.stroke(120*(1-c), 100, 100, 0.5) // 0-240 = red-blue
            this.memo_g.line(this.memo_g.width*(i/n), this.memo_g.height*i_in/(n_in-1), this.memo_g.width*(i+1)/n, this.memo_g.height*(i_out+1)/n_out)
          }
        }
      }
    }
    this.p.image(this.memo_g!, 0, 0)
  }
}

export type envString = 'Cheetah'
export const getModel = (p: P5Instance, env: envString): MyModel => {
  if (env === 'Cheetah') {
    return new MyModel(p, CheetahGame.obs_size, [16, CheetahGame.act_size])
  } else {
    throw new Error(`Unrecodnized env name: ${env}`)
  }
}