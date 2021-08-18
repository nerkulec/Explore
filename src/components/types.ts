import { envString } from "../evo/Model"

export type settingsType = {
  env: envString,
  n_agents: number,
  ep_len: number,
  anim_time_coef: number,
  mutation_rate: number,
  loops: number,
  num_elites: number,
  num_selects: number
}