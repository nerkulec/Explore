import { CheetahGame, Game } from "../evo/Game"
import { envString, getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo, permute } from "../evo/Evolution"
import { getAnimations } from "./animations"

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
  let simrate = 30

  let append_rewards: (rewards: number[]) => void

  p.setup = () => {
    p.createCanvas(1080, 720, p.P2D)
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

  const update = async () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actions = []
    for (let i=0; i<n_agents; i++) {
      actions.push((models[i].predict(obs.slice(i, 1)) as any).array())
    }
    await Promise.all(actions.map(async (action, i) => {
      games[i].update((await action)[0])
    }))
  }
  const sleep = (t: number) => new Promise(resolve => setTimeout(resolve, t))
  const rolloutLoop = async () => {
    for (frame=0; frame<ep_len; frame++) {
      let start = performance.now()
      await Promise.all([update(), sleep(0)])
      const stop = performance.now()
      const simrate_ = 1000/(stop-start)
      simrate = 0.9*simrate + 0.1*simrate_
      start = stop
    }
  }

  function* rolloutAnimation(rank?: number[]) {
    if (rank) {
      permute(models, rank)
    }
    let finished = false
    rolloutLoop().then(() => finished = true)
    while (!finished) {
      // eslint-disable-next-line
      for (const i of anims.gamesIter(undefined, games.map(g => g.reward))) {}

      p.text(`simrate: ${simrate.toFixed(1)}`, p.width*0.91, 42)
      p.text(`frame: ${frame}`, p.width*0.9, 63)
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
    // animation_queue.push(anims => anims.pauseAnimation(evolutionInfo))
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
    framerate = 0.95*framerate+0.05*p.frameRate()
    p.text(`framerate: ${framerate.toFixed(1)}`, p.width*0.91, 21)
  }
}

export default sketch