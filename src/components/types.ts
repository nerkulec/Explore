import { envString } from "../evo/Model"

export type settingsType = {
  env: envString,
  nAgents: number,
  nAgentsToBe: number,
  epLen: number,
  animTimeCoef: number,
  mutationRate: number,
  mutationProb: number,
  mutateElites: boolean,
  loops: number,
  numElites: number,
  numSelects: number,
  framesElites: number,
  framesPerPair: number,
  framesLosers: number,
  framesPerCrossover: number,
  framesMutation: number,
  framesPermutation: number,
  framesFadeIn: number,
  showNNs: boolean
}