import { envString } from "../evo/Model"

export type settingsType = {
  env: envString,
  numAgents: number,
  numAgentsToBe: number,
  epLen: number,
  animTimeCoef: number,
  mutationRate: number,
  mutationProb: number,
  mutateElites: boolean,
  commaVariant: boolean,
  loops: number,
  numElites: number,
  numSelects: number,
  numParents: number,
  tournamentSize: number,
  advancedAnimation: boolean,
  framesElites: number,
  framesPerPair: number,
  framesLosers: number,
  framesPerCrossover: number,
  framesMutation: number,
  framesPermutation: number,
  framesFadeIn: number,
  showNN: boolean
}