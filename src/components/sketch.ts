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
    showNN: false
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

  let append_quantiles: (qs: number[]) => void
  let append_gens_since_created: (qs: number[]) => void
  let append_gens_since_mutated: (qs: number[]) => void
  let append_mutation_success: (s: number) => void
  let append_crossover_success: (s: number) => void

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
    animation_queue.push(rolloutAnimation({prev_rank: []}))
  }

  p.updateWithProps = ({
    env: newEnv, epLen, nAgents, animTime, mutationRate, mutationProb,
    appendQuantiles, appendMutationSuccess, appendCrossoverSuccess,
    appendGensSinceCreated, appendGensSinceMutated,
    loops: newLoops, numElites, numSelects, mutateElites, framesElites, 
    framesPerPair, framesLosers, framesPerCrossover, framesMutation,
    framesPermutation, framesFadeIn, showNN
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
      framesPermutation, framesFadeIn, showNN
    }
    Object.assign(settings, newSettings)

    anims = getAnimations({p, settings, models, games})
    append_quantiles = appendQuantiles
    append_gens_since_created = appendGensSinceCreated
    append_gens_since_mutated = appendGensSinceMutated
    append_mutation_success = appendMutationSuccess
    append_crossover_success = appendCrossoverSuccess
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

  function* rolloutAnimation({
    prev_rank, max_parents_rewards, mutated_rewards
  }: {
    prev_rank: number[], max_parents_rewards?: [number, number][], mutated_rewards?: [number, number][]
  }) {
    const start = performance.now()
    if (prev_rank && prev_rank.length > 0) {
      permute(models, prev_rank)
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
      const id = games.map((_, i) => i)
      // eslint-disable-next-line
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
    animation_queue.push(rolloutAnimation({
      prev_rank: info.rank, max_parents_rewards: info.max_parents_rewards, mutated_rewards: info.mutated_rewards
    }))

    const { rewards, rank } = info
    const n = rewards.length
    const { floor } = Math
    append_quantiles([
      rewards[rank[0]],
      rewards[rank[floor(n*0.25)]],
      rewards[rank[floor(n*0.5)]],
      rewards[rank[floor(n*0.75)]],
      rewards[rank[n-1]]
    ])
    if (max_parents_rewards) {
      const fraction = max_parents_rewards
        .reduce((count: number, [child_index, max_parents_reward]) => 
          rewards[child_index] > max_parents_reward ? count+1 : count, 0)/max_parents_rewards.length
      append_crossover_success(max_parents_rewards.length !== 0 ? fraction : 0)
    }
    if (mutated_rewards) {
      const fraction = mutated_rewards
        .reduce((count: number, [index, pre_mutation_reward]) => 
          rewards[index] > pre_mutation_reward ? count+1 : count, 0)/mutated_rewards.length
      append_mutation_success(mutated_rewards.length !== 0 ? fraction : 0)
    }
    const gensSinceCreated = models.map(m => m.generations_since_created).sort((a, b) => b-a)
    append_gens_since_created([
      gensSinceCreated[0],
      gensSinceCreated[floor(n*0.25)],
      gensSinceCreated[floor(n*0.5)],
      gensSinceCreated[floor(n*0.75)],
      gensSinceCreated[n-1]
    ])
    const gensSinceMutated = models.map(m => m.generations_since_mutated).sort((a, b) => b-a)
    append_gens_since_mutated([
      gensSinceMutated[0],
      gensSinceMutated[floor(n*0.25)],
      gensSinceMutated[floor(n*0.5)],
      gensSinceMutated[floor(n*0.75)],
      gensSinceMutated[n-1]
    ])

    models.forEach(m => m.bump_generation())

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