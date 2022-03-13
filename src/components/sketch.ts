import { environments, Game, GraphoidGame } from "../evo/Game"
import {  adaptation_dimension, getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo, permute } from "../evo/Evolution"
import { getAnimations } from "./animations"
import { settingsType } from "./types"
import { get_random_graphoid } from "../evo/Agent"
import { transform_settings } from "./App"

let DEBUG = false

type ValueOf<T> = T[keyof T]

export const initial_settings: settingsType = {
  env: 'Graphoid',
  deterministic: true,
  numAgents: 49,
  numAgentsToBe: 49,
  epLen: 400,//600,
  animTimeCoef: 100, //100
  mutationRate: 10,
  mutationProb: 100,
  tau: 5,
  tau_0: 5,
  kappa: 5,
  mutateElites: false,
  adaptMutationRate: true,
  commaVariant: false,
  loops: 1,
  numElites: 1,
  numSelects: 10,
  numParents: 2,
  tournamentSize: 4,
  framesElites: 90,
  framesPerPair: 30,
  framesLosers: 90,
  framesPerCrossover: 30,
  framesMutation: 90,
  framesPermutation: 90,
  framesFadeIn: 20,
  showNN: true,
  advancedAnimation: false
} as const

const sketch = (p: P5Instance) => {
  let Environment: ValueOf<typeof environments> = GraphoidGame
  const settings: settingsType = transform_settings(initial_settings)
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
  let append_sigmas: (sigmas: number[][]) => void

  const reset_all = () => {
    models.splice(0)
    games.splice(0)
    Environment = environments[settings.env]
    for (let i=0; i<settings.numAgents; i++) {
      const model = getModel(p, settings.env)
      models.push(model)
      if (settings.env === 'Graphoid') {
        const genotype = get_random_graphoid()
        const game = new GraphoidGame(p, genotype)
        games.push(game)
        model.graphoid_genotype = genotype
      } else {
        const game = new (Environment as any)(p)
        games.push(game)
      }
    }
  }

  const reset_games = () => {
    games.splice(0)
    Environment = environments[settings.env]
    if (settings.env === 'Graphoid') {
      for (let i=0; i<settings.numAgents; i++) {
        const model = models[i]
        const genotype = model.graphoid_genotype
        const game = new GraphoidGame(p, genotype!)
        games.push(game)
      }
    } else {
      for (let i=0; i<settings.numAgents; i++) {
        const game = new (Environment as any)(p)
        games.push(game)
      }
    }
  }

  p.setup = () => {
    tf.setBackend('cpu')
    p.createCanvas(1080, 720, p.P2D)
    p.frameRate(60)
    reset_all()
    const font = p.loadFont("OpenSans-Regular.ttf")
    p.textFont(font)
    p.textAlign(p.CENTER)
    anims = getAnimations({p, settings, models, games})
    animation_queue.push(rolloutAnimation({prev_rank: []}))
  }

  p.updateWithProps = ({
    settings: newSettings, appendQuantiles,
    appendGensSinceMutated, appendGensSinceCreated,
    appendMutationSuccess, appendCrossoverSuccess,
    appendSigmas
  }) => {
    newSettings.numAgentsToBe = newSettings.numAgents
    if (newSettings.env !== settings.env) {
      settings.env = newSettings.env
      reset_all()
      current_animation = null
      animation_queue.splice(0)
      animation_queue.push(rolloutAnimation({prev_rank: []}))
    }
    if (newSettings.numAgents !== settings.numAgentsToBe) {
      settings.numAgentsToBe = newSettings.numAgents
    }
    delete newSettings.numAgents
    const transformed_settings = transform_settings(newSettings)
    Object.assign(settings, transformed_settings)

    anims = getAnimations({p, settings, models, games})
    append_quantiles = appendQuantiles
    append_gens_since_created = appendGensSinceCreated
    append_gens_since_mutated = appendGensSinceMutated
    append_mutation_success = appendMutationSuccess
    append_crossover_success = appendCrossoverSuccess
    append_sigmas = appendSigmas
  }

  const update = () => {
    for (let i=0; i<settings.numAgents; i++) {
      const game = games[i]
      const model = models[i]
      if (!game.terminated) {
        const obs = game.getObservation()
        const action = (model.predict(tf.tensor2d([obs])) as any).arraySync()[0] as number[]
        game.update(action)
      }
    }
  }

  const update_num_agents = (settings: settingsType) => {
    if (settings.numAgents !== settings.numAgentsToBe) {
      if (settings.numAgentsToBe > settings.numAgents) {
        for (let i=0; i<settings.numAgentsToBe-settings.numAgents; i++) {
          const model = getModel(p, settings.env)
          models.push(model)
          if (settings.env === 'Graphoid') {
            const genotype = get_random_graphoid()
            model.graphoid_genotype = genotype
            games.push(new GraphoidGame(p, genotype))
          } else {
            games.push(new (Environment as any)(p))
          }
        }
      } else {
        models.splice(settings.numAgentsToBe)
        games.splice(settings.numAgentsToBe)
      }
      settings.numAgents = settings.numAgentsToBe
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
      if (settings.env === 'Graphoid') {
        reset_games()
      }
    }
    update_num_agents(settings)
    for (frame=0; frame<settings.epLen;) {
      let i
      let games_finished = false
      for (i=0; i<settings.loops; i++) {
        update()
        frame++
        games_finished = games.every(g => g.terminated)
        if (frame >= settings.epLen || games_finished) {
          break
        }
      }
      const id = games.map((_, i) => i)
      if ((games[0] as any).getBaseReward) {
        // eslint-disable-next-line
        for (const i of anims.gamesIter({
          winners: id, rank: id, rewards: games.map(g => g.getReward()),
          base_rewards: (games as any).map((g: any) => g.getBaseReward()),
          energy_costs: (games as any).map((g: any) => g.getEnergyCost()),
          nn_scale: 0.3, highlight_best: true})) {}
      } else {
        // eslint-disable-next-line
        for (const i of anims.gamesIter({
          winners: id, rank: id, rewards: games.map(g => g.getReward()),
          nn_scale: 0.3})) {}
      }
      if (DEBUG) {
        p.text(`simrate: ${simrate.toFixed(1)}`, p.width*0.91, 54)
        p.text(`frame: ${frame}`, p.width*0.9, 75)
      }
      yield
      if (games_finished) {
        break
      }
    }
    const time = performance.now()-start
    simrate = settings.epLen*1000/time

    gen_num += 1

    const info = getEvolutionInfo(games, models, settings)
    animation_queue.push(anims.permutationAnimation(info))
    animation_queue.push(anims.elitesAnimation(info))
    animation_queue.push(anims.tournamentSelectionAnimation(info))
    animation_queue.push(anims.eliminationAnimation(info))
    animation_queue.push(anims.crossoverAnimation(info))
    animation_queue.push(anims.mutationAnimation(info))
    animation_queue.push(rolloutAnimation({
      prev_rank: info.rank, max_parents_rewards: info.max_parents_rewards, mutated_rewards: info.mutated_rewards
    }))

    let { rewards, rank } = info
    const n = rewards.length
    const { floor } = Math
    rewards = rewards.map(r => Math.max(-10, r))
    append_quantiles([
      rewards[rank[0]],
      rewards[rank[floor(n*0.25)]],
      rewards[rank[floor(n*0.5)]],
      rewards[rank[floor(n*0.75)]],
      rewards[rank[n-1]]
    ])
    const sigmass = models.map(m => m.log_sigmas)
    const sigmas_quantiles = []
    for (let i=0; i<adaptation_dimension; i++) {
      const sigmas = sigmass.map(ss => ss[i]).sort((a, b) => b-a)
      sigmas_quantiles.push([
        sigmas[0],
        sigmas[floor(n*0.25)],
        sigmas[floor(n*0.5)],
        sigmas[floor(n*0.75)],
        sigmas[n-1]
      ])
    }
    // sigmas_quantiles.shape = [adaptation_dimension, 5]
    append_sigmas(sigmas_quantiles)

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
    if (DEBUG)
      console.log(`generation ${gen_num}`)
  }

  p.draw = () => {
    p.blendMode((p as any).REMOVE)
    p.background(255)
    p.blendMode(p.BLEND)
    p.strokeWeight(0)
    if ((p as any)._renderer.drawingContext instanceof WebGLRenderingContext) {
      p.translate(-p.width/2, -p.height/2)
    }
    p.translate(6, 6)
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
    if (DEBUG)
      p.text(`framerate: ${framerate.toFixed(1)}`, p.width*0.91, 33)
  }
}

export default sketch