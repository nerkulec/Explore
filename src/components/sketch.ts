import { CheetahGame, Game } from "../evo/Game"
import { getModel, MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import * as tf from '@tensorflow/tfjs'
import { getEvolutionInfo, mutate, EvolutionInfo, crossover } from "../evo/Evolution"

type color = [number, number, number, number]
const survivor_green: color = [0, 255, 0, 63]

const sketch = (p: P5Instance) => {
  let n_agents = 36
  let n_visible_agents = 36
  let ep_len = 600/8
  let loop_time = 4
  let frames_elites = 90
  let frames_per_pair = 20
  let frames_losers = 90
  let frames_per_crossover = 40
  let frames_mutation = 90
  let frames_permutation = 90
  let games: Game[]
  let models: MyModel[]
  let ep = 0
  let gen_num = 0
  let rewards: number[] = []
  let animations: (Generator | Function)[] = []
  let showRewards = false
  let dx: number, dy: number
  let margin = 0.5
  let w: number
  let drawGames = true
  let doUpdate = true

  const getXY = (i: number): [number, number] => {
    return [i%w, Math.floor(i/w)]
  }

  const transformSubgame = (x: number, y: number) => {
    p.translate(x*dx, y*dy)
    p.scale(1/(w+margin), 1/(w+margin))
  }

  function* gamesIter() {
    const w = Math.ceil(Math.sqrt(n_agents))
    const margin = 0.5
    for (let y=0; y<w; y++) {
      for (let x=0; x<w; x++) {
        const i = y*w+x
        if (i>=n_agents)
          return
        
        p.push()
        transformSubgame(x, y)
        yield i
        p.pop()
      }
    }
  }

  function* textAnimation(text: string, frames: number) {
    for (let frame=0; frame<frames; frame++) {
      const k = frame/(frames-1)
      const f = k < 0.2 ? (1-Math.cos(k*5*Math.PI))/2 : 1
      p.fill(0, 0, 0, 255*f)
      p.textAlign(p.CENTER)
      p.textSize(40)
      p.text(text, p.width/2, p.height/2)
      yield
    }
  }

  function* elitesAnimation(elites: number[]) {
    const text_animation = textAnimation('ELITISM', frames_elites)
    for (let frame=0; frame<frames_elites; frame++) {
      const k = frame/(frames_elites-1)-0.5
      if (k>0) {
        for (const i of gamesIter()) {
          if (elites.includes(i)) {
            const elite_color: color = [...survivor_green]
            elite_color[3] *= k
            p.fill(...elite_color)
            p.rect(0, 0, p.width, p.height)
          }
        }
      }
      text_animation.next()
      yield
    }
  }

  function* tournamentSelectionAnimation(matchups: [number, number][], elites: number[]) {
    const text_animation = textAnimation('SELECTION', frames_per_pair*matchups.length)
    const winners_so_far: number[] = [...elites]
    for (const matchup of matchups) {
      for (let frame=0; frame<frames_per_pair; frame++) {
        for (const i of gamesIter()) {
          if (matchup.includes(i)) {
            if (frame<frames_per_pair/2) {
              continue
            } else if (matchup[0] === i) {
              p.fill(0, 255, 0, 127)
            } else {
              p.fill(255, 0, 0, 127)
            }
          } else if (winners_so_far.includes(i)) {
            p.fill(...survivor_green)
          } else {
            p.fill(255, 255, 255, 127)
          }
          p.rect(0, 0, p.width, p.height)
        }
        text_animation.next()
        yield
      }
      winners_so_far.push(matchup[0])
    }
  }

  function* eliminationAnimation(losers: number[]) {
    const text_animation = textAnimation('ELIMINATION', frames_losers)
    for (let frame=0; frame<frames_losers; frame++) {
      for (const i of gamesIter()) {
        if (losers.includes(i)) {
          p.fill(255, 255, 255, 255*frame/(frames_losers-1))
        } else {
          p.fill(...survivor_green)
        }
        p.rect(0, 0, p.width, p.height)
      }
      text_animation.next()
      yield
    }
  }

  function* crossoverAnimation(losers: number[], parents: [number, number, number][]) {
    const text_animation = textAnimation('CROSSOVER', frames_per_crossover*parents.length)
    const replaced: number[] = []
    for (const [child, father, mother] of parents) {
      const [cx, cy] = getXY(child)
      const [fx, fy] = getXY(father)
      const [mx, my] = getXY(mother)
      for (let frame=0; frame<frames_per_crossover; frame++) {
        for (const i of gamesIter()) {
          if (losers.includes(i) && !replaced.includes(i)) {
            p.fill(255, 255, 255, 255)
            p.rect(0, 0, p.width, p.height)
          } else if (i !== father && i !== mother) {
            p.fill(...survivor_green)
            p.rect(0, 0, p.width, p.height)
          }
        }
        const k = frame/(frames_per_crossover-1)
        p.push()
        transformSubgame(fx+(cx-fx)*k, fy+(cy-fy)*k)
        games[father].draw(false)
        p.pop()
        p.push()
        transformSubgame(mx+(cx-mx)*k, my+(cy-my)*k)
        games[mother].draw(false)
        p.pop()
        text_animation.next()
        yield
      }
      crossover(models[father], models[mother]).then(childModel => {
        replaced.push(child)
        // models[child].dispose() // Bug: deleting same tensor twice
        models[child] = childModel
      })
    }
  }

  function* mutationAnimation(elites: number[]) {
    const text_animation = textAnimation('MUTATION', frames_mutation)
    const n = models.length
    for (let frame=0; frame<frames_mutation; frame++) {
      const k = frame/(frames_mutation-1)
      p.fill(0, 0, 255, 127*(1-Math.cos(k*2*Math.PI)/2))
      for (const i of gamesIter()) {
        if (!elites.includes(i)) {
          p.rect(0, 0, p.width, p.height)
        }
      }
      text_animation.next()
      yield
    }
    for (let i=0; i<n; i++) {
      if (!elites.includes(i)) {
        mutate(models[i])
      }
    }
  }

  function* permutationAnimation() {
    for (let frame=0; frame<frames_permutation; frame++) {

      yield
    }
  }

  p.setup = () => {
    p.createCanvas(1080, 720)
    p.frameRate(60)
    games = []
    models = []
    for (let i=0; i<n_agents; i++) {
      models.push(getModel(CheetahGame.obs_size, [64, CheetahGame.act_size]))
      const game = new CheetahGame(p)
      game.reset()
      games.push(game)
    }
    p.textAlign(p.CENTER)
    w = Math.ceil(Math.sqrt(n_agents))
    dx = p.width/w
    dy = p.height/w
  }

  p.updateWithProps = props => {
    
  }

  const update = async () => {
    const obs = tf.tensor2d(games.map(game => game.getObservation()))
    const actions = []
    for (let i=0; i<n_agents; i++) {
      actions.push((models[i].predict(obs.slice(i, 1)) as any).arraySync())
    }
    for (let i=0; i<n_agents; i++) {
      games[i].update(actions[i][0])
    }
    ep += 1
    if (ep >= ep_len) {
      ep = 0
      gen_num += 1
      rewards = games.map(game => game.reward)
      const evolutionInfo = getEvolutionInfo(rewards, models)
      showRewards = true
      doUpdate = false
      animations.push(elitesAnimation(evolutionInfo.elites))
      animations.push(tournamentSelectionAnimation(evolutionInfo.matchups, evolutionInfo.elites))
      animations.push(() => showRewards = false)
      animations.push(eliminationAnimation(evolutionInfo.losers))
      animations.push(crossoverAnimation(evolutionInfo.losers, evolutionInfo.parents))
      animations.push(mutationAnimation(evolutionInfo.elites))
      animations.push(permutationAnimation())
      animations.push(() => {
        games.forEach(game => game.reset())
        doUpdate = true
      })
      console.log(`generation ${gen_num}`)
    }
  }

  p.draw = async () => {
    // p.noStroke()
    if (doUpdate) {
      const start = performance.now()
      let loops = 0
      while (performance.now()-start < loop_time) {
        await update()
        loops += 1
      }
      p.fill(0)
      p.text(`loops: ${loops}`, p.width*0.9, 20)
    }
    if (drawGames) {
      p.strokeWeight(0.01)
      p.background(255)
      for (const i of gamesIter()) {
        games[i].draw()
        p.fill(0)
        if (showRewards && rewards[i]) {
          p.textSize(200)
          p.text(`${rewards[i].toFixed(2)}`, p.width/2, 200)
        }
      }
    }
    while (true) {
      if (animations.length === 0)
        break
      const animation = animations[0]
      if (typeof animation === 'function') {
        animation()
        animations.shift()
      } else if (animation.next().done) {
        animations.shift()
      } else {
        break
      }
    }
  }
}

export default sketch