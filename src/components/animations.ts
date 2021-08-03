import { crossover, EvolutionInfo, mutate, permute } from "../evo/Evolution"
import { Game } from "../evo/Game"
import { MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"

export type color = [number, number, number, number]
export const survivor_green: color = [0, 255, 0, 63]

const frames_elites = 90
const frames_per_pair = 40
const frames_losers = 90
const frames_per_crossover = 40
const frames_mutation = 90
const frames_permutation = 90
const frames_fade_in = 20
const margin = 0.5

export const setLoop = (cb: () => Promise<any>, ms: number, original = true) => {
  if (ms < 0)
    return
  const start = performance.now()
  cb().then(() => setLoop(cb, ms-performance.now()+start, false))
}

export const getAnimations = ({p, n_agents, anim_time_coef, models, games, rewards}:
  {p: P5Instance, n_agents: number, anim_time_coef: number, models: MyModel[], games: Game[], rewards: number[]}) => {

  const w = Math.ceil(Math.sqrt(n_agents))
  const dx = p.width/w
  const dy = p.height/w
  const scale = 1/(w+margin)

  const getXY = (i: number): [number, number] => {
    return [i%w, Math.floor(i/w)]
  }

  const transformSubgame = (x: number, y: number) => {
    p.translate(x*dx, y*dy)
    p.scale(scale, scale)
  }

  function* gamesIter(rewards?: (number | null)[]) {
    for (let y=0; y<w; y++) {
      for (let x=0; x<w; x++) {
        const i = y*w+x
        if (i>=n_agents)
          return
        
        p.push()
        transformSubgame(x, y)
        games[i].draw()
        if (rewards) {
          const r = rewards[i]
          if (r !== null) {
            p.textSize(120)
            p.text(r.toFixed(1), p.width/2, 130)
          }
        }
        yield i
        p.pop()
      }
    }
  }

  function* textAnimation(text: string, frames: number) {
    for (let frame=0; frame<frames*anim_time_coef; frame++) {
      const k = frame/(frames_fade_in*anim_time_coef-1)
      const f = frame<frames_fade_in*anim_time_coef ? (1-Math.cos(k*Math.PI))/2 : 1
      p.fill(0, 0, 0, 255*f)
      p.textAlign(p.CENTER)
      p.textSize(40)
      p.text(text, p.width/2, p.height/2)
      yield
    }
  }

  function* permutationAnimation({rank, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('PERMUTATION', frames_permutation*anim_time_coef)
    const prev_pos = games.map((_, i) => getXY(i))
    const post_pos = games.map((_, i) => getXY(rank[i]))
    for (let frame=0; frame<frames_permutation*anim_time_coef; frame++) {
      const k = frame/(frames_permutation*anim_time_coef-1)
      for (let i=0; i<rank.length; i++) {
        p.push()
        const x = prev_pos[i][0]+(post_pos[i][0]-prev_pos[i][0])*k
        const y = prev_pos[i][1]+(post_pos[i][1]-prev_pos[i][1])*k
        transformSubgame(x, y)
        games[i].draw()
        const r = rewards[i]
        if (r !== null) {
          p.textSize(120)
          p.text(r.toFixed(1), p.width/2, 130)
        }
        p.pop()
      }
      text_animation.next()
      yield
    }
    permute(rewards, rank)
    permute(games, rank)
    permute(models, rank)
  }

  function* elitesAnimation({elites, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('ELITISM', frames_elites*anim_time_coef)
    for (let frame=0; frame<frames_elites*anim_time_coef; frame++) {
      const k = frame/(frames_elites*anim_time_coef-1)-0.5
      if (k>0) {
        for (const i of gamesIter(rewards)) {
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

  function* tournamentSelectionAnimation({matchups, elites, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('SELECTION', frames_per_pair*anim_time_coef*matchups.length)
    const winners_so_far: number[] = [...elites]
    for (const matchup of matchups) {
      for (let frame=0; frame<frames_per_pair*anim_time_coef; frame++) {
        for (const i of gamesIter(rewards)) {
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

  function* eliminationAnimation({losers, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('ELIMINATION', frames_losers*anim_time_coef)
    for (const i of losers) {
      rewards[i] = null
    }
    for (let frame=0; frame<frames_losers*anim_time_coef; frame++) {
      for (const i of gamesIter(rewards)) {
        if (losers.includes(i)) {
          p.fill(255, 255, 255, 255*frame/(frames_losers*anim_time_coef-1))
        } else {
          p.fill(...survivor_green)
        }
        p.rect(0, 0, p.width, p.height)
      }
      text_animation.next()
      yield
    }
  }

  function* crossoverAnimation({losers, parents, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('CROSSOVER', frames_per_crossover*anim_time_coef*parents.length)
    const replaced: number[] = []
    for (const [child, father, mother] of parents) {
      const [cx, cy] = getXY(child)
      const [fx, fy] = getXY(father)
      const [mx, my] = getXY(mother)
      for (let frame=0; frame<frames_per_crossover*anim_time_coef; frame++) {
        for (const i of gamesIter(rewards)) {
          if (losers.includes(i) && !replaced.includes(i)) {
            p.fill(255, 255, 255, 255)
            p.rect(0, 0, p.width, p.height)
          } else if (i !== father && i !== mother) {
            p.fill(...survivor_green)
            p.rect(0, 0, p.width, p.height)
          }
        }
        const k = frame/(frames_per_crossover*anim_time_coef-1)
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

  function* mutationAnimation({elites}: EvolutionInfo) {
    const text_animation = textAnimation('MUTATION', frames_mutation*anim_time_coef)
    const n = models.length
    for (let frame=0; frame<frames_mutation*anim_time_coef; frame++) {
      const k = frame/(frames_mutation*anim_time_coef-1)
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

  return {
    getXY,
    transformSubgame,
    gamesIter,
    textAnimation,
    elitesAnimation,
    tournamentSelectionAnimation,
    eliminationAnimation,
    crossoverAnimation,
    mutationAnimation,
    permutationAnimation
  }
}