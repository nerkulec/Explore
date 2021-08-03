import { CheetahGame, Game } from "../evo/Game"
import { getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo } from "../evo/Evolution"
import { getAnimations, setLoop } from "./animations"

type envString = 'Cheetah'
const environments = {
  'Cheetah': CheetahGame
}

const sketch = (p: P5Instance) => {
  let env = 'Cheetah'
  let Environment = CheetahGame
  let n_agents = 36
  let ep_len = 600
  let anim_time_coef = 1
  let games: Game[]
  let models: MyModel[]
  let gen_num = 0
  let rewards: number[] = []
  let animation_queue: (Generator | Function)[] = []
  let anims: any

  p.setup = () => {
    p.createCanvas(1080, 720, p.WEBGL)
    p.frameRate(60)
    games = []
    models = []
    for (let i=0; i<n_agents; i++) {
      models.push(getModel(CheetahGame.obs_size, [64, CheetahGame.act_size]))
      const game = new CheetahGame(p)
      game.reset()
      games.push(game)
    }
    const font = p.loadFont("OpenSans-Regular.ttf")
    p.textFont(font)
    p.textAlign(p.CENTER)
    anims = getAnimations({p, n_agents, anim_time_coef, models, games, rewards})
    animation_queue.push(rolloutAnimation())
  }

  p.updateWithProps = ({env: newEnv, epLen, nAgents, animTime}) => {
    if (newEnv !== env) {
      env = newEnv
      games = []
      models = []
      Environment = environments[env as envString]
      for (let i=0; i<n_agents; i++) {
        models.push(getModel(Environment.obs_size, [64, Environment.act_size]))
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
          models.push(getModel(Environment.obs_size, [64, Environment.act_size]))
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
    anims = getAnimations({p, n_agents, anim_time_coef, models, games, rewards})
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

  function* rolloutAnimation() {
    for (let frame=0; frame<ep_len; frame++) {
      setLoop(update, 10)
      for (const i of anims.gamesIter(games.map(g => g.reward))) {}

      p.text(`frame: ${frame}`, p.width*0.9, 42)
      yield
    }

    gen_num += 1
    rewards = games.map(game => game.reward)
    const evolutionInfo = getEvolutionInfo(rewards, models)
    animation_queue.push(anims.permutationAnimation(evolutionInfo))
    animation_queue.push(anims.elitesAnimation(evolutionInfo))
    animation_queue.push(anims.tournamentSelectionAnimation(evolutionInfo))
    animation_queue.push(anims.eliminationAnimation(evolutionInfo))
    animation_queue.push(anims.crossoverAnimation(evolutionInfo))
    animation_queue.push(anims.mutationAnimation(evolutionInfo))
    animation_queue.push(rolloutAnimation())
    console.log(`generation ${gen_num}`)
  }

  p.draw = () => {
    p.background(255)
    p.strokeWeight(0)
    p.translate(-p.width/2, -p.height/2)
    while (animation_queue.length > 0) {
      const animation = animation_queue[0]
      if (typeof animation === 'function') {
        animation()
        animation_queue.shift()
      } else if (animation.next().done) {
        animation_queue.shift()
      } else {
        break
      }
    }
    p.fill(0)
    p.textSize(20)
    p.text(`framerate: ${p.frameRate().toFixed(2)}`, p.width*0.91, 21)
  }
}

export default sketch