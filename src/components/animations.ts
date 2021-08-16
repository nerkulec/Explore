import { crossover, EvolutionInfo, mutate } from "../evo/Evolution"
import { Game } from "../evo/Game"
import { MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import { settingsType } from "./types"

export type color = [number, number, number, number]
export const survivor_green: color = [0, 255, 0, 63]

const frames_elites = 90
const frames_per_pair = 30
const frames_losers = 90
const frames_per_crossover = 30
const frames_mutation = 90
const frames_permutation = 90
const frames_fade_in = 20
const margin = 0.5

export const getAnimations = ({p, models, games, settings}:
  {p: P5Instance, models: MyModel[], games: Game[], settings: settingsType}) => {

  const getXY = (i: number): [number, number] => {
    const w = Math.ceil(Math.sqrt(settings.n_agents))
    return [i%w, Math.floor(i/w)]
  }

  const transformSubgame = (x: number, y: number) => {
    const w = Math.ceil(Math.sqrt(settings.n_agents))
    const dx = p.width/w
    const dy = p.height/w
    const scale = 1/(w+margin)
    p.translate(x*dx, y*dy)
    p.scale(scale, scale)
  }

  function* gamesIter(rank?: number[], rewards?: (number | null)[]) {
    const w = Math.ceil(Math.sqrt(settings.n_agents))
    for (let y=0; y<w; y++) {
      for (let x=0; x<w; x++) {
        let i = y*w+x
        if (i>=settings.n_agents)
          return
        
        p.push()
        transformSubgame(x, y)
        if (rank)
          i = rank[i]
        games[i].draw()
        if (rewards) {
          const r = rewards[i]
          if (r !== null) {
            p.textSize(120)
            p.text(r.toFixed(2), p.width/2, 130)
          }
        }
        yield i
        p.pop()
      }
    }
  }

  function* pauseAnimation({rank, rewards}: EvolutionInfo, frames = 20) {
    for (let frame=0; frame<frames*settings.anim_time_coef; frame++) {
      // eslint-disable-next-line
      for (const i of gamesIter(rank, rewards)) {}
      yield
    }
  }

  function* textAnimation(text: string, frames: number) {
    for (let frame=0; frame<frames*settings.anim_time_coef; frame++) {
      const k = frame/(frames_fade_in*settings.anim_time_coef-1)
      const f = frame<frames_fade_in*settings.anim_time_coef ? (1-Math.cos(k*Math.PI))/2 : 1
      p.fill(0, 0, 0, 255*f)
      p.textAlign(p.CENTER)
      p.textSize(40)
      p.text(text, p.width/2, p.height/2)
      yield
    }
  }

  function* permutationAnimation({rank, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('PERMUTATION', frames_permutation)
    const prev_pos = games.map((_, i) => getXY(i))
    const post_pos = games.map((_, i) => getXY(rank.indexOf(i)))
    for (let frame=0; frame<frames_permutation*settings.anim_time_coef; frame++) {
      const k = frame/(frames_permutation*settings.anim_time_coef-1)
      for (let i=0; i<rank.length; i++) {
        p.push()
        const x = prev_pos[i][0]+(post_pos[i][0]-prev_pos[i][0])*k
        const y = prev_pos[i][1]+(post_pos[i][1]-prev_pos[i][1])*k
        transformSubgame(x, y)
        games[i].draw()
        const r = rewards[i]
        if (r !== null) {
          p.textSize(120)
          p.text(r.toFixed(2), p.width/2, 130)
        }
        p.pop()
      }
      text_animation.next()
      yield
    }
  }

  function* elitesAnimation({elites, rewards, rank}: EvolutionInfo) {
    const text_animation = textAnimation('ELITISM', frames_elites)
    for (let frame=0; frame<frames_elites*settings.anim_time_coef; frame++) {
      const k = frame/(frames_elites*settings.anim_time_coef-1)
      for (const i of gamesIter(rank, rewards)) {
        if (elites.includes(i)) {
          const elite_color: color = [...survivor_green]
          elite_color[3] *= k
          p.fill(...elite_color)
          p.rect(0, 0, p.width, p.height)
        }
      }
      text_animation.next()
      yield
    }
  }

  function* tournamentSelectionAnimation({matchups, elites, rewards, rank}: EvolutionInfo) {
    const text_animation = textAnimation('SELECTION', frames_per_pair*matchups.length)
    const winners_so_far: number[] = [...elites]
    for (const matchup of matchups) {
      if (winners_so_far.includes(matchup[0]))
        continue
      for (let frame=0; frame<frames_per_pair*settings.anim_time_coef; frame++) {
        for (const i of gamesIter(rank, rewards)) {
          if (matchup.includes(i)) {
            if (frame<frames_per_pair*0.7) {
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

  function* eliminationAnimation({losers, rewards, rank}: EvolutionInfo) {
    const text_animation = textAnimation('ELIMINATION', frames_losers)
    for (const i of losers) {
      rewards[i] = null
    }
    for (let frame=0; frame<frames_losers*settings.anim_time_coef; frame++) {
      for (const i of gamesIter(rank, rewards)) {
        if (losers.includes(i)) {
          p.fill(255, 255, 255, 255*frame/(frames_losers*settings.anim_time_coef-1))
        } else {
          p.fill(...survivor_green)
        }
        p.rect(0, 0, p.width, p.height)
      }
      text_animation.next()
      yield
    }
    games.forEach(g => g.reset())
  }

  function* crossoverAnimation({losers, parents, rewards, rank, inv_rank}: EvolutionInfo) {
    const text_animation = textAnimation('CROSSOVER', frames_per_crossover*parents.length)
    const replaced: number[] = []
    parents.sort(([c1], [c2]) => inv_rank[c1]-inv_rank[c2])
    for (const [child, father, mother] of parents) {
      const [cx, cy] = getXY(rank.indexOf(child))
      const [fx, fy] = getXY(rank.indexOf(father))
      const [mx, my] = getXY(rank.indexOf(mother))
      for (let frame=0; frame<frames_per_crossover*settings.anim_time_coef; frame++) {
        for (const i of gamesIter(rank, rewards)) {
          if (losers.includes(i) && !replaced.includes(i)) {
            p.fill(255, 255, 255, 255)
            p.rect(0, 0, p.width, p.height)
          } else if (i !== father && i !== mother) {
            p.fill(255, 255, 255, 127)
            p.rect(0, 0, p.width, p.height)
          }
        }
        const k = frame/(frames_per_crossover*settings.anim_time_coef-1)
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
        models[child].dispose() // Bug: deleting same tensor twice
        models[child] = childModel
      }) // TODO: DANGEROUS
    }
  }

  function* mutationAnimation({elites, rank}: EvolutionInfo) {
    const text_animation = textAnimation('MUTATION', frames_mutation)
    const n = models.length
    for (let frame=0; frame<frames_mutation*settings.anim_time_coef; frame++) {
      const k = frame/(frames_mutation*settings.anim_time_coef-1)
      p.fill(0, 0, 255, 127*(1-Math.cos(k*2*Math.PI)/2))
      for (const i of gamesIter(rank)) {
        if (!elites.includes(i)) {
          p.rect(0, 0, p.width, p.height)
        }
      }
      text_animation.next()
      yield
    }
    for (let i=0; i<n; i++) {
      if (!elites.includes(i)) {
        mutate(models[i], settings.mutation_rate)
      }
    }
  }

  return {
    getXY,
    transformSubgame,
    gamesIter,
    textAnimation,
    pauseAnimation,
    elitesAnimation,
    tournamentSelectionAnimation,
    eliminationAnimation,
    crossoverAnimation,
    mutationAnimation,
    permutationAnimation
  }
}