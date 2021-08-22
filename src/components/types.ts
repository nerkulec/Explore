import { envString } from "../evo/Model"

export type settingsType = {
  env: envString,
  n_agents: number,
  n_agents_to_be: number,
  ep_len: number,
  anim_time_coef: number,
  mutation_rate: number,
  mutation_prob: number,
  mutate_elites: boolean,
  loops: number,
  num_elites: number,
  num_selects: number,
  frames_elites: number,
  frames_per_pair: number,
  frames_losers: number,
  frames_per_crossover: number,
  frames_mutation: number,
  frames_permutation: number,
  frames_fade_in: number
}