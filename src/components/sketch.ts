import { CheetahGame, Game } from "../evo/Game"
import { envString, getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo, permute } from "../evo/Evolution"
import { getAnimations } from "./animations"
import { lookupService } from "dns"

const sketch = (p: P5Instance) => {
  let env: envString = 'Cheetah'
  let Environment = CheetahGame
  let n_agents = 36
  let ep_len = 600
  let anim_time_coef = 1
  let mutation_rate = 0.1
  let games: Game[]
  let models: MyModel[]
  let gen_num = 0
  let rewards: number[] = []
  let animation_queue: ((anims: any) => Generator)[] = []
  let current_animation: Generator | null
  let anims: any
  let frame = 0
  let framerate = 60
  let simtime = 30

  let append_rewards: (rewards: number[]) => void

  p.setup = () => {
    tf.setBackend('cpu')
    p.createCanvas(1080, 720, p.P2D)
    const r = p.createCanvas(1080, 720, p.P2D)
    console.log((p as any)._renderer)
    ;(p as any)._renderer = r
    p.frameRate(60)
    games = []
    models = []
    for (let i=0; i<n_agents; i++) {
      models.push(getModel(env))
      const game = new CheetahGame(p)
      game.reset()
      games.push(game)
    }
    const font = p.loadFont("OpenSans-Regular.ttf")
    p.textFont(font)
    p.textAlign(p.CENTER)
    anims = getAnimations({p, n_agents, anim_time_coef, models, games, rewards, mutation_rate})
    animation_queue.push(() => rolloutAnimation())
  }

  p.updateWithProps = ({env: newEnv, epLen, nAgents, animTime, mutationRate,
    appendRewards
  }) => {
    if (newEnv !== env) {
      env = newEnv
      games = []
      models = []
      for (let i=0; i<n_agents; i++) {
        models.push(getModel(env))
        const game = new Environment(p)
        game.reset()
        games.push(game)
      }
    }
    if (epLen !== ep_len) {
      ep_len = epLen
    }
    if (nAgents !== n_agents) {
      if (nAgents > n_agents) {
        for (let i=0; i<nAgents-n_agents; i++) {
          models.push(getModel(env))
          const game = new Environment(p)
          game.reset()
          games.push(game)
        }
      } else {
        models = models.slice(0, nAgents)
        games = games.slice(0, nAgents)
      }
      n_agents = nAgents
    }
    if (animTime !== anim_time_coef) {
      anim_time_coef = animTime/100
    }
    if (mutationRate !== mutation_rate) {
      mutation_rate = mutationRate
    }
    anims = getAnimations({p, n_agents, anim_time_coef, models, games, rewards, mutation_rate})
    append_rewards = appendRewards
  }

  const update = () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actions = []
    for (let i=0; i<n_agents; i++) {
      actions.push((models[i].predict(obs.slice(i, 1)) as any).arraySync())
    }
    actions.forEach((action, i) => games[i].update((action)[0]))
  }

  function* rolloutAnimation(rank?: number[]) {
    if (rank) {
      permute(models, rank)
    }
    for (frame=0; frame<ep_len; frame++) {
      let start = performance.now()
      for (let i=0; i<1; i++) {
        update()
      }
      const stop = performance.now()
      const simtime_ = 1000/(stop-start)
      simtime = 0.9*simtime + 0.1*simtime_
      start = stop
      // eslint-disable-next-line
      for (const i of anims.gamesIter(undefined, games.map(g => g.reward))) {}

      p.text(`simtime: ${simtime.toFixed(1)}`, p.width*0.91, 54)
      p.text(`frame: ${frame}`, p.width*0.9, 75)
      yield
    }

    gen_num += 1
    rewards = games.map(game => game.reward)
    append_rewards(rewards)
    const evolutionInfo = getEvolutionInfo(rewards, models)
    animation_queue.push(anims => anims.permutationAnimation(evolutionInfo))
    animation_queue.push(anims => anims.elitesAnimation(evolutionInfo))
    animation_queue.push(anims => anims.tournamentSelectionAnimation(evolutionInfo))
    animation_queue.push(anims => anims.eliminationAnimation(evolutionInfo))
    animation_queue.push(anims => anims.crossoverAnimation(evolutionInfo))
    animation_queue.push(anims => anims.mutationAnimation(evolutionInfo))
    animation_queue.push(() => rolloutAnimation(evolutionInfo.rank))
    console.log(`generation ${gen_num}`)
  }

  p.draw = () => {
    p.background(255)
    p.strokeWeight(0)
    if ((p as any)._renderer.drawingContext instanceof WebGLRenderingContext) {
      p.translate(-p.width/2, -p.height/2)
    }
    let drawn = false
    while (!drawn) {
      if (current_animation) {
        if (current_animation.next().done) {
          animation_queue.shift()
          current_animation = null
        } else {
          drawn = true
        }
      }
      if (!current_animation) {
        if (animation_queue.length > 0) {
          current_animation = animation_queue[0](anims)
        } else {
          drawn = true
        }
      }
    }
    p.fill(0)
    p.textSize(20)
    framerate = 0.9*framerate+0.1*p.frameRate()
    p.text(`framerate: ${framerate.toFixed(1)}`, p.width*0.91, 33)
  }
}

export default sketch