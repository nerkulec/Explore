import { crossover, EvolutionInfo, mutate } from "../evo/Evolution"
import { Game } from "../evo/Game"
import { MyModel } from "../evo/Model"
import { P5Instance } from "./P5Wrapper"
import { settingsType } from "./types"

export type color = [number, number, number, number]
export const survivor_green: color = [0, 255, 0, 63]
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

  function* gamesIter({winners, rank, rewards, draw_game=true, nn_scale=0}: 
    {winners: number[], rank?: number[], rewards?: number[], draw_game?: boolean, nn_scale?: number}) {
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
        if (draw_game) {
          games[i].draw()
        }
        if (nn_scale > 0) {
          p.push()
          p.scale(nn_scale)
          models[i].draw()
          p.pop()
        }
        if (rewards) {
          if (winners?.includes(i)) {
            const r = rewards[i]
            p.textSize(120)
            p.text(r.toFixed(2), p.width/2, 130)
          }
        }
        yield i
        p.pop()
      }
    }
  }

  function* pauseAnimation({winners, rank, rewards}: EvolutionInfo, frames = 20) {
    for (let frame=0; frame<frames*settings.anim_time_coef; frame++) {
      // eslint-disable-next-line
      for (const i of gamesIter({winners, rank, rewards})) {}
      yield
    }
  }

  function* textAnimation(text: string, frames: number) {
    for (let frame=0; frame<frames*settings.anim_time_coef; frame++) {
      const k = frame/(settings.frames_fade_in*settings.anim_time_coef-1)
      const f = frame<settings.frames_fade_in*settings.anim_time_coef ? (1-Math.cos(k*Math.PI))/2 : 1
      p.fill(0, 0, 0, 255*f)
      p.textAlign(p.CENTER)
      p.textSize(40)
      p.text(text, p.width/2, p.height/2)
      yield
    }
  }

  function* nnZoomAnimation({winners, rank, rewards}: EvolutionInfo, frames: number, from=0.3, to=1) {
    for (let frame=0; frame<frames*settings.anim_time_coef; frame++) {
      const k = frame/(frames*settings.anim_time_coef-1)
      for (let i of gamesIter({winners, rank, rewards, nn_scale: from+(to-from)*k})) {}
      yield
    }
  }

  function* permutationAnimation({inv_rank, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('PERMUTATION', settings.frames_permutation)
    const prev_pos = games.map((_, i) => getXY(i))
    const post_pos = games.map((_, i) => getXY(inv_rank[i]))
    for (let frame=0; frame<settings.frames_permutation*settings.anim_time_coef; frame++) {
      const k = frame/(settings.frames_permutation*settings.anim_time_coef-1)
      for (let i=0; i<rewards.length; i++) {
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
        p.scale(0.3)
        models[i].draw()
        p.pop()
      }
      text_animation.next()
      yield
    }
  }

  function* elitesAnimation({elites, rewards, rank, winners}: EvolutionInfo) {
    const text_animation = textAnimation('ELITISM', settings.frames_elites)
    for (let frame=0; frame<settings.frames_elites*settings.anim_time_coef; frame++) {
      const k = frame/(settings.frames_elites*settings.anim_time_coef-1)
      for (const i of gamesIter({winners, rank, rewards, nn_scale: 0.3})) {
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

  function* tournamentSelectionAnimation({matchups, elites, rewards, rank, winners}: EvolutionInfo) {
    const text_animation = textAnimation('SELECTION', settings.frames_per_pair*matchups.length)
    const winners_so_far: number[] = [...elites]
    for (const matchup of matchups) {
      if (winners_so_far.includes(matchup[0]))
        continue
      for (let frame=0; frame<settings.frames_per_pair*settings.anim_time_coef; frame++) {
        for (const i of gamesIter({winners: rewards.map((_, i) => i), rank, rewards, nn_scale: 0.3})) {
          if (matchup.includes(i)) {
            if (frame<settings.frames_per_pair*0.7) {
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

  function* eliminationAnimation({losers, rewards, rank, winners}: EvolutionInfo) {
    const text_animation = textAnimation('ELIMINATION', settings.frames_losers)
    for (let frame=0; frame<settings.frames_losers*settings.anim_time_coef; frame++) {
      for (const i of gamesIter({winners, rank, rewards, nn_scale: 0.3})) {
        if (losers.includes(i)) {
          p.fill(255, 255, 255, 255*frame/(settings.frames_losers*settings.anim_time_coef-1))
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

  function* crossoverAnimation(info: EvolutionInfo) {
    const {losers, parents, rewards, rank, inv_rank, winners} = info
    const text_animation = textAnimation('CROSSOVER', settings.frames_per_crossover*parents.length)
    const replaced: number[] = []
    parents.sort(([c1], [c2]) => inv_rank[c1]-inv_rank[c2])
    yield* nnZoomAnimation(info, 40, 0.3, 1)
    for (const [child, father, mother] of parents) {
      const [cx, cy] = getXY(rank.indexOf(child))
      const [fx, fy] = getXY(rank.indexOf(father))
      const [mx, my] = getXY(rank.indexOf(mother))
      for (let frame=0; frame<settings.frames_per_crossover*settings.anim_time_coef; frame++) {
        for (const i of gamesIter({winners, rank, rewards, nn_scale: 1})) {
          if (losers.includes(i)) {
            if (!replaced.includes(i)) {
              p.fill(255, 255, 255, 255)
              p.rect(0, 0, p.width, p.height)
            } else {
              // models[i].draw()
            }
          } else if (i !== father && i !== mother) {
            p.fill(255, 255, 255, 127)
            p.rect(0, 0, p.width, p.height)
          }
        }
        const k = frame/(settings.frames_per_crossover*settings.anim_time_coef)
        p.push()
          transformSubgame(fx+(cx-fx)*k, fy+(cy-fy)*k)
          models[father].draw()
        p.pop()
        p.push()
          transformSubgame(mx+(cx-mx)*k, my+(cy-my)*k)
          models[mother].draw()
        p.pop()
        text_animation.next()
        yield
      }
      const childModel = crossover(models[father], models[mother])
      replaced.push(child)
      models[child].dispose()
      models[child] = childModel
    }
  }

  function* mutationAnimation(info: EvolutionInfo) {
    const {mutants, rank, winners} = info
    const text_animation = textAnimation('MUTATION', settings.frames_mutation)
    const n = models.length
    for (let frame=0; frame<settings.frames_mutation*settings.anim_time_coef; frame++) {
      const k = frame/(settings.frames_mutation*settings.anim_time_coef-1)
      p.fill(0, 0, 255, 127*(1-Math.cos(k*2*Math.PI)/2))
      for (const i of gamesIter({winners, rank, nn_scale: 1})) {
        if (mutants.includes(i)) {
          p.rect(0, 0, p.width, p.height)
        }
      }
      text_animation.next()
      yield
    }
    yield* nnZoomAnimation(info, 40, 1, 0.3)
    for (let i=0; i<n; i++) {
      if (mutants.includes(i)) {
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