import { argsort, crossover, EvolutionInfo, mutate } from "../evo/Evolution"
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
    const w = Math.ceil(Math.sqrt(settings.numAgents))
    return [i%w, Math.floor(i/w)]
  }

  const transformSubgame = (x: number, y: number) => {
    const w = Math.ceil(Math.sqrt(settings.numAgents))
    const dx = p.width/w
    const dy = p.height/w
    const scale = 1/(w+margin)
    p.translate(x*dx, y*dy)
    p.scale(scale, scale)
  }

  function* gamesIter({winners, rank, rewards, base_rewards, energy_costs, draw_game=true, nn_scale=0, highlight_best=false}: {
    winners: number[], rank?: number[], rewards?: number[], draw_game?: boolean,
    nn_scale?: number, base_rewards?: number[], energy_costs?: number[], highlight_best?: boolean
  }) {
    const w = Math.ceil(Math.sqrt(settings.numAgents))
    let new_rank
    if (rewards && highlight_best) {
      new_rank = argsort(rewards)
    }
    for (let y=0; y<w; y++) {
      for (let x=0; x<w; x++) {
        let i = y*w+x
        if (i>=settings.numAgents)
          return
        
        p.push()
        transformSubgame(x, y)
        if (rank)
          i = rank[i]
        if (draw_game) {
          if (new_rank && new_rank[new_rank.length-1] === i) {
            p.push()
            p.translate(0.5*p.width, 0.5*p.height)
            p.scale(1.1)
            p.translate(-0.5*p.width, -0.5*p.height)
          }
          games[i].draw()
        }
        if (settings.showNN && nn_scale > 0) {
          p.push()
          p.scale(nn_scale)
          models[i].draw()
          p.pop()
        }
        if (rewards) {
          if (base_rewards && energy_costs) {
            const br = base_rewards[i]
            const ec = energy_costs[i]
            p.textSize(120)
            p.text(br.toFixed(2), p.width*0.4, 130)
            p.text('-', p.width*0.6, 130)
            p.text(ec.toFixed(2), p.width*0.8, 130)
          } else if (winners?.includes(i)) {
            const r = rewards[i]
            p.textSize(120)
            p.text(r.toFixed(2), p.width/2, 130)
          }
        }

        if (draw_game && new_rank && new_rank[new_rank.length-1] === i) {
          p.pop()
        }
        yield i
        p.pop()
      }
    }
  }

  function* pauseAnimation({winners, rank, rewards}: EvolutionInfo, frames = 20) {
    for (let frame=0; frame<frames*settings.animTimeCoef; frame++) {
      // eslint-disable-next-line
      for (const i of gamesIter({winners, rank, rewards})) {}
      yield
    }
  }

  function* textAnimation(text: string, text_secondary: string, frames: number) {
    for (let frame=0; frame<frames*settings.animTimeCoef; frame++) {
      const k1 = frame/(settings.framesFadeIn*settings.animTimeCoef-1)
      const k2 = Math.max(0, k1-0.2)
      const f1 = frame<settings.framesFadeIn*settings.animTimeCoef ? (1-Math.cos(k1*Math.PI))/2 : 1
      const f2 = frame<settings.framesFadeIn*settings.animTimeCoef ? (1-Math.cos(k2*Math.PI))/2 : 1
      p.textAlign(p.CENTER)
      p.fill(0, 0, 0, 255*f1)
      p.textSize(48)
      p.text(text, p.width/2, p.height*0.4)
      p.fill(20, 20, 20, 255*f2)
      p.textSize(36)
      p.text(text_secondary, p.width/2, p.height*0.5)
      yield
    }
  }

  function* nnZoomAnimation({winners, rank, rewards}: EvolutionInfo, frames: number, from=0.3, to=1) {
    for (let frame=0; frame<frames*settings.animTimeCoef; frame++) {
      const k = frame/(frames*settings.animTimeCoef-1)
      // eslint-disable-next-line
      for (let i of gamesIter({winners, rank, rewards, nn_scale: from+(to-from)*k})) {
        if (!winners.includes(i)) {
          p.fill(255)
          p.blendMode((p as any).REMOVE)
          p.rect(0, 0, p.width*1.01, p.height*1.01)
        }
      }
      yield
    }
  }

  function* permutationAnimation({inv_rank, rewards}: EvolutionInfo) {
    const text_animation = textAnimation('EVALUATION', 'Survival of the fittest', settings.framesPermutation)
    const prev_pos = games.map((_, i) => getXY(i))
    const post_pos = games.map((_, i) => getXY(inv_rank[i]))
    for (let frame=0; frame<settings.framesPermutation*settings.animTimeCoef; frame++) {
      const k = frame/(settings.framesPermutation*settings.animTimeCoef-1)
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
        if (settings.showNN)
          models[i].draw()
        p.pop()
      }
      text_animation.next()
      yield
    }
  }

  function* elitesAnimation({elites, rewards, rank, winners}: EvolutionInfo) {
    const text_animation = textAnimation('ELITISM', 'Elites are preserved', settings.framesElites)
    for (let frame=0; frame<settings.framesElites*settings.animTimeCoef; frame++) {
      const k = frame/(settings.framesElites*settings.animTimeCoef-1)
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

  function* tournamentSelectionAnimation({matchups, elites, rewards, rank}: EvolutionInfo) {
    const text_animation = textAnimation('TOURNAMENT SELECTION', 'Winners survive', settings.framesPerPair*matchups.length)
    const winners_so_far: number[] = [...elites]
    for (const matchup of matchups) {
      if (winners_so_far.includes(matchup[0]))
        continue
      for (let frame=0; frame<settings.framesPerPair*settings.animTimeCoef; frame++) {
        for (const i of gamesIter({winners: rewards.map((_, i) => i), rank, rewards, nn_scale: 0.3})) {
          if (matchup.includes(i)) {
            if (frame<settings.framesPerPair*0.7) {
              continue
            } else if (matchup[0] === i) {
              p.fill(0, 255, 0, 127)
            } else {
              p.fill(255, 0, 0, 127)
            }
          } else if (winners_so_far.includes(i)) {
            p.fill(...survivor_green)
          } else {
            p.blendMode((p as any).REMOVE)
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
    const text_animation = textAnimation('ELIMINATION', 'The weak give way', settings.framesLosers)
    for (let frame=0; frame<settings.framesLosers*settings.animTimeCoef; frame++) {
      for (const i of gamesIter({winners, rank, rewards, nn_scale: 0.3})) {
        if (losers.includes(i)) {
          p.blendMode((p as any).REMOVE)
          p.fill(255, 255, 255, 255*frame/(settings.framesLosers*settings.animTimeCoef-1))
        } else {
          p.fill(...survivor_green)
        }
        p.rect(0, 0, p.width*1.01, p.height*1.01)
      }
      text_animation.next()
      yield
    }
    games.forEach(g => g.reset())
    if (!settings.deterministic) {
      games.forEach(g => g.perturb())
    }
  }

  function* crossoverAnimation(info: EvolutionInfo) {
    const {losers, parents, rewards, rank, inv_rank, winners} = info
    const text_animation = textAnimation('CROSSOVER', 'For the new generation', settings.framesPerCrossover*parents.length)
    const replaced: number[] = []
    parents.sort(([c1], [c2]) => inv_rank[c1]-inv_rank[c2])
    yield* nnZoomAnimation(info, 40, 0.3, 1)
    const old_models = [...models]
    const to_remove = []
    for (const [child, ...fathers] of parents) {
      const [cx, cy] = getXY(inv_rank[child])
      const xys = fathers.map(f => getXY(inv_rank[f]))
      for (let frame=0; frame<settings.framesPerCrossover*settings.animTimeCoef; frame++) {
        for (const i of gamesIter({winners, rank, rewards, nn_scale: 1})) {
          if (losers.includes(i)) {
            p.blendMode((p as any).REMOVE)
            if (!replaced.includes(i)) {
              p.fill(255, 255, 255, 255)
              p.rect(0, 0, p.width*1.01, p.height*1.01)
            } else {
              p.fill(255, 255, 255, 127)
              p.rect(0, 0, p.width*1.01, p.height*1.01)
            }
          } else if (!fathers.includes(i)) {
            p.blendMode((p as any).REMOVE)
            p.fill(255, 255, 255, 127)
            p.rect(0, 0, p.width*1.01, p.height*1.01)
          }
        }
        const k = frame/(settings.framesPerCrossover*settings.animTimeCoef)
        for (let i=0; i<fathers.length; i++) {
          const father = fathers[i]
          const [fx, fy] = xys[i]
          p.push()
          transformSubgame(fx+(cx-fx)*k, fy+(cy-fy)*k)
          if (settings.showNN) {
            models[father].draw()
          } else {
            games[father].draw(false)
          }
          p.pop()
        }
        text_animation.next()
        yield
      }
      const childModel = crossover(fathers.map(f => old_models[f]))
      replaced.push(child)
      to_remove.push(models[child])
      models[child] = childModel
    }
    to_remove.forEach(m => m.dispose())
  }

  function* mutationAnimation(info: EvolutionInfo) {
    const {mutants, rank, winners} = info
    const text_animation = textAnimation('MUTATION', 'As the evolution happens', settings.framesMutation)
    const n = models.length
    for (let frame=0; frame<settings.framesMutation*settings.animTimeCoef; frame++) {
      const k = frame/(settings.framesMutation*settings.animTimeCoef-1)
      for (const i of gamesIter({winners, rank, nn_scale: 1})) {
        if (mutants.includes(i)) {
          const factor = Math.tanh(0.1*models[i].mutation_coef)*0.5+0.5
          p.fill(0, 0, 255, factor*127*(1-Math.cos(k*2*Math.PI)/2))
          p.rect(0, 0, p.width, p.height)
        }
      }
      text_animation.next()
      yield
    }
    for (let i=0; i<n; i++) {
      if (mutants.includes(i)) {
        mutate(models[i], settings)
        models[i].generations_since_mutated = 0
      }
    }
    yield* nnZoomAnimation({...info, winners: models.map((m, i) => i)}, 40, 1, 0.3)
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