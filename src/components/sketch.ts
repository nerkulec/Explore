import { CheetahGame, Game } from "../evo/Game"
import {  getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo, permute } from "../evo/Evolution"
import { getAnimations } from "./animations"
import { settingsType } from "./types"

const sketch = (p: P5Instance) => {
  let Environment = CheetahGame
  const settings: settingsType = {
    env: 'Cheetah',
    nAgents: 36,
    nAgentsToBe: 36,
    epLen: 600,
    animTimeCoef: 1,
    mutationRate: 0.1,
    mutationProb: 0.5,
    mutateElites: false,
    loops: 1,
    numElites: 4,
    numSelects: 18,
    framesElites: 90,
    framesPerPair: 30,
    framesLosers: 90,
    framesPerCrossover: 30,
    framesMutation: 90,
    framesPermutation: 90,
    framesFadeIn: 20,
    showNNs: true
  }
  const games: Game[] = []
  const models: MyModel[] = []
  let gen_num = 0
  const animation_queue: Generator[] = []
  let current_animation: Generator | null
  let anims: ReturnType<typeof getAnimations>
  let frame = 0
  let framerate = 60
  let simrate = 140

  let append_reward: (reward: number) => void
  let append_median: (median: number) => void
  let append_std: (std: number) => void
  let append_correlation: (corr: number) => void

  p.setup = () => {
    tf.setBackend('cpu')
    p.createCanvas(1080, 720, p.P2D)
    p.frameRate(60)
    for (let i=0; i<settings.nAgents; i++) {
      models.push(getModel(p, settings.env))
      const game = new CheetahGame(p)
      games.push(game)
    }
    const font = p.loadFont("OpenSans-Regular.ttf")
    p.textFont(font)
    p.textAlign(p.CENTER)
    anims = getAnimations({p, settings, models, games})
    animation_queue.push(rolloutAnimation({rank: []}))
  }

  p.updateWithProps = ({
    env: newEnv, epLen, nAgents, animTime, mutationRate, mutationProb,
    appendReward, appendMedian, appendStd, appendCorrelation,
    loops: newLoops, numElites, numSelects, mutateElites, framesElites, 
    framesPerPair, framesLosers, framesPerCrossover, framesMutation,
    framesPermutation, framesFadeIn
  }) => {
    if (newEnv !== settings.env) {
      settings.env = newEnv
      games.splice(0)
      models.splice(0)
      for (let i=0; i<settings.nAgents; i++) {
        models.push(getModel(p, settings.env))
        const game = new Environment(p)
        game.reset()
        games.push(game)
      }
    }
    if (nAgents !== settings.nAgentsToBe) {
      settings.nAgentsToBe = nAgents
    }
    const newSettings = {
      animTimeCoef: animTime, mutationRate, mutationProb, epLen,
      loops: newLoops, numElites, numSelects, mutateElites, framesElites, 
      framesPerPair, framesLosers, framesPerCrossover, framesMutation,
      framesPermutation, framesFadeIn
    }
    Object.assign(settings, newSettings)

    anims = getAnimations({p, settings, models, games})
    append_reward = appendReward
    append_median = appendMedian
    append_std = appendStd
    append_correlation = appendCorrelation
  }

  const update = () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actions = []
    for (let i=0; i<settings.nAgents; i++) {
      actions.push((models[i].predict(obs.slice(i, 1)) as any).arraySync())
    }
    actions.forEach((action, i) => games[i].update((action)[0]))
  }

  const update_n_agents = (settings: settingsType) => {
    if (settings.nAgents !== settings.nAgentsToBe) {
      if (settings.nAgentsToBe > settings.nAgents) {
        for (let i=0; i<settings.nAgentsToBe-settings.nAgents; i++) {
          models.push(getModel(p, settings.env))
          const game = new Environment(p)
          games.push(game)
        }
      } else {
        models.splice(settings.nAgentsToBe)
        games.splice(settings.nAgentsToBe)
      }
      settings.nAgents = settings.nAgentsToBe
    }
  }

  function* rolloutAnimation({rank, mean_parents_rewards}: {rank: number[], mean_parents_rewards?: [number, number][]}) {
    const start = performance.now()
    if (rank && rank.length > 0) {
      permute(models, rank)
    }
    update_n_agents(settings)
    for (frame=0; frame<settings.epLen;) {
      let i
      for (i=0; i<settings.loops; i++) {
        update()
        frame++
        if (frame >= settings.epLen) {
          break
        }
      }
      // eslint-disable-next-line
      const id = games.map((_, i) => i)
      for (const i of anims.gamesIter({winners: id, rank: id, rewards: games.map(g => g.reward), nn_scale: 0.3})) {}

      p.text(`simrate: ${simrate.toFixed(1)}`, p.width*0.91, 54)
      p.text(`frame: ${frame}`, p.width*0.9, 75)
      yield
    }
    const time = performance.now()-start
    simrate = settings.epLen*1000/time

    gen_num += 1

    const info = getEvolutionInfo(games.map(game => game.reward), models, settings)
    animation_queue.push(anims.permutationAnimation(info))
    animation_queue.push(anims.elitesAnimation(info))
    animation_queue.push(anims.tournamentSelectionAnimation(info))
    animation_queue.push(anims.eliminationAnimation(info))
    animation_queue.push(anims.crossoverAnimation(info))
    animation_queue.push(anims.mutationAnimation(info))
    animation_queue.push(rolloutAnimation({rank: info.rank, mean_parents_rewards: info.mean_parents_rewards}))

    const n = info.rewards.length
    append_reward(Math.max(...info.rewards))
    append_median(info.rewards[info.rank[Math.floor(n/2)]])
    const mean = info.rewards.reduce((s, x) => s+x, 0)/n
    const std = Math.sqrt(info.rewards.map(x => x-mean).map(x => x*x).reduce((s, x) => s+x, 0)/n)
    append_std(std)
    if (mean_parents_rewards) {
      const offspring_rewards = mean_parents_rewards
        .map(([child, parent_reward]) => [info.rewards[child], parent_reward])
      const [mean_child_reward, mean_parent_reward] = offspring_rewards
        .reduce(([s_child, s_parents], [child_reward, parents_reward]) => [s_child+child_reward, s_parents+parents_reward], [0, 0])
        .map(x => x/mean_parents_rewards.length)
      const normalized_rewards = offspring_rewards.map(([c, p]) => [c-mean_child_reward, p-mean_parent_reward])
      const [child_std, parent_std] = normalized_rewards
        .reduce(([c_s, p_s], [c, p]) => [c_s+c*c, p_s+p*p], [0, 0]).map(Math.sqrt)
      const correlation = normalized_rewards.map(([c, p]) => c*p).reduce((s, v) => s+v, 0)/(child_std*parent_std)
      append_correlation(isFinite(correlation) ? correlation : 0)
    }

    console.log(`generation ${gen_num}`)
  }

  p.draw = async () => {
    p.background(255)
    p.strokeWeight(0)
    if ((p as any)._renderer.drawingContext instanceof WebGLRenderingContext) {
      p.translate(-p.width/2, -p.height/2)
    }
    let drawn = false
    while (!drawn) {
      if (current_animation) {
        const next = current_animation.next()
        if (next.done) {
          animation_queue.shift()
          current_animation = null
        } else {
          drawn = true
        }
      }
      if (!current_animation) {
        if (animation_queue.length > 0) {
          current_animation = animation_queue[0]
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