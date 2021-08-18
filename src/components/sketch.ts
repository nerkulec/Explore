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
    n_agents: 36,
    n_agents_to_be: 36,
    ep_len: 600,
    anim_time_coef: 1,
    mutation_rate: 0.1,
    mutation_prob: 0.5,
    mutate_elites: false,
    loops: 1,
    num_elites: 4,
    num_selects: 18
  }
  const games: Game[] = []
  const models: MyModel[] = []
  const promises: Promise<void>[] = []
  let gen_num = 0
  const animation_queue: (Generator | AsyncGenerator)[] = []
  let current_animation: Generator | AsyncGenerator | null
  let anims: ReturnType<typeof getAnimations>
  let frame = 0
  let framerate = 60
  let simrate = 140

  let append_rewards: (rewards: number[]) => void

  p.setup = () => {
    tf.setBackend('cpu')
    p.createCanvas(1080, 720, p.P2D)
    p.frameRate(60)
    for (let i=0; i<settings.n_agents; i++) {
      models.push(getModel(settings.env))
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
    appendRewards, loops: newLoops, numElites, numSelects, mutateElites
  }) => {
    if (newEnv !== settings.env) {
      settings.env = newEnv
      games.splice(0)
      models.splice(0)
      for (let i=0; i<settings.n_agents; i++) {
        models.push(getModel(settings.env))
        const game = new Environment(p)
        game.reset()
        games.push(game)
      }
    }
    if (epLen !== settings.ep_len) {
      settings.ep_len = epLen
    }
    if (nAgents !== settings.n_agents_to_be) {
      settings.n_agents_to_be = nAgents
    }
    if (animTime !== settings.anim_time_coef) {
      settings.anim_time_coef = animTime/100
    }
    if (mutationRate !== settings.mutation_rate) {
      settings.mutation_rate = mutationRate
    }
    if (mutationProb !== settings.mutation_prob) {
      settings.mutation_prob = mutationProb
    }
    if (mutateElites !== settings.mutate_elites) {
      settings.mutate_elites = mutateElites
    }
    if (newLoops !== settings.loops) {
      settings.loops = newLoops
    }
    if (numElites !== settings.num_elites) {
      settings.num_elites = numElites
    }
    if (numSelects !== settings.num_selects) {
      settings.num_selects = numSelects
    }
    anims = getAnimations({p, settings, models, games})
    append_rewards = appendRewards
  }

  const update = () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actions = []
    for (let i=0; i<settings.n_agents; i++) {
      actions.push((models[i].predict(obs.slice(i, 1)) as any).arraySync())
    }
    actions.forEach((action, i) => games[i].update((action)[0]))
  }

  const update_n_agents = (settings: settingsType) => {
    if (settings.n_agents !== settings.n_agents_to_be) {
      if (settings.n_agents_to_be > settings.n_agents) {
        for (let i=0; i<settings.n_agents_to_be-settings.n_agents; i++) {
          models.push(getModel(settings.env))
          const game = new Environment(p)
          games.push(game)
        }
      } else {
        models.splice(settings.n_agents_to_be)
        games.splice(settings.n_agents_to_be)
      }
      settings.n_agents = settings.n_agents_to_be
    }
  }

  function* rolloutAnimation({rank}: {rank: number[]}) {
    const start = performance.now()
    if (rank && rank.length > 0) {
      permute(models, rank)
    }
    update_n_agents(settings)
    for (frame=0; frame<settings.ep_len;) {
      let i
      for (i=0; i<settings.loops; i++) {
        update()
        frame++
        if (frame >= settings.ep_len) {
          break
        }
      }
      // eslint-disable-next-line
      for (const i of anims.gamesIter(undefined, games.map(g => g.reward))) {}

      p.text(`simrate: ${simrate.toFixed(1)}`, p.width*0.91, 54)
      p.text(`frame: ${frame}`, p.width*0.9, 75)
      yield
    }
    const time = performance.now()-start
    simrate = settings.ep_len*1000/time

    gen_num += 1
    const rewards = games.map(game => game.reward)
    append_rewards(rewards)
    const evolutionInfo = getEvolutionInfo(rewards, models, settings)
    animation_queue.push(anims.permutationAnimation(evolutionInfo))
    animation_queue.push(anims.elitesAnimation(evolutionInfo))
    animation_queue.push(anims.tournamentSelectionAnimation(evolutionInfo))
    animation_queue.push(anims.eliminationAnimation(evolutionInfo))
    animation_queue.push(anims.crossoverAnimation(evolutionInfo, promises))
    animation_queue.push(anims.mutationAnimation(evolutionInfo))
    animation_queue.push(rolloutAnimation({rank: evolutionInfo.rank}))
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
        const next = await Promise.resolve(current_animation.next())
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