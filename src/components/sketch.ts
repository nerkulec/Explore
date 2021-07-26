import { CheetahGame, Game } from "../evo/Game"
import { getModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { evolution } from "../evo/Evolution"

const sketch = (p: P5Instance) => {
  const n_agents = 36
  const ep_len = 600
  let loop_time = 100
  let games: Game[]
  let models: tf.Sequential[]
  let ep = 0
  let gen_num = 0
  let rewards: number[]

  p.setup = () => {
    p.createCanvas(1080, 720)
    p.frameRate(24)
    games = []
    models = []
    for (let i=0; i<n_agents; i++) {
      models.push(getModel(CheetahGame.obs_size, [64, CheetahGame.act_size]))
      const game = new CheetahGame(p)
      game.reset()
      games.push(game)
    }
  }

  p.updateWithProps = props => {
    
  }

  const update = async () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actionPromises = []
    for (let i=0; i<n_agents; i++) {
      actionPromises.push((models[i].predict(obs.slice(i, 1)) as any).array())
    }
    const actions = await Promise.all(actionPromises)
    for (let i=0; i<n_agents; i++) {
      games[i].update(actions[i][0])
    }
    ep += 1
    if (ep >= ep_len) {
      ep = 0
      gen_num += 1
      rewards = games.map(game => game.reward)
      evolution(rewards, models)
      games.forEach(game => game.reset())
      console.log(`generation ${gen_num}`)
      console.log(`rewards: ${rewards[0]}`)
    }
  }

  p.draw = async () => {
    // p.noStroke()
    const start = performance.now()
    let loops = 0
    while (performance.now()-start < loop_time) {
      await update()
      loops += 1
    }
    p.strokeWeight(0.01)
    p.background(255)
    const w = Math.ceil(Math.sqrt(n_agents))
    const margin = 0.5
    const dx = p.width/w
    const dy = p.height/w
    for (let y=0; y<w; y++) {
      for (let x=0; x<w; x++) {
        const i = y*w+x
        if (i>=n_agents)
          break
        p.push()
        p.translate(x*dx, y*dy)
        p.scale(1/(w+margin), 1/(w+margin))
        p.translate(p.width/2, p.height/2)
        games[i].draw()
        p.pop()
        p.push()
        p.translate(x*dx, y*dy)
        if (rewards && rewards[i])
          p.text(`${rewards[i].toFixed(2)}`, 0, 10)
        p.pop()
      }
    }
    p.fill(0)
    p.text(`loops: ${loops}`, p.width*0.9, 20)
  }
}

export default sketch