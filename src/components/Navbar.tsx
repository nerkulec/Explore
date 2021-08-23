import React, { ReactElement } from 'react'
import './Navbar.css'

const changer = (setter: (v: any) => void) => 
  (event: React.ChangeEvent<HTMLInputElement>) => 
    setter(parseFloat(event.target.value))


export default function Navbar({
  env, setEnv, epLen, setEpLen, nAgents, setNAgents, animTime, setAnimTime,
  mutationRate, setMutationRate, mutationRateValues, mutationProb, setMutationProb, setMutateElites,
  loops, setLoops, numElites, setNumElites, numSelects, setNumSelects}: {
  env: string, setEnv: (env: string) => void,
  epLen: number, setEpLen: (len: number) => void,
  nAgents: number, setNAgents: (n: number) => void,
  animTime: number, setAnimTime: (time: number) => void,
  mutationRate: number, setMutationRate: (rate: number) => void,
  mutationRateValues: number[],
  mutationProb: number, setMutationProb: (prob: number) => void,
  setMutateElites: (setter: (bool: boolean) => boolean) => void,
  loops: number, setLoops: (n: number) => void,
  numElites: number, setNumElites: (n: number) => void,
  numSelects: number, setNumSelects: (n: number) => void,
  framesElites: number, setFramesElites: (n: number) => void,
  framesPerPair: number, setFramesPerPair: (n: number) => void,
  framesLosers: number, setFramesLosers: (n: number) => void,
  framesPerCrossover: number, setFramesPerCrossover: (n: number) => void,
  framesMutation: number, setFramesMutation: (n: number) => void,
  framesPermutation: number, setFramesPermutation: (n: number) => void,
  framesFadeIn: number, setFramesFadeIn: (n: number) => void,
}): ReactElement {
  return (
    <div className='navbar'>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='row'>
          <div className='column'>
            <div className='control-el'>
              <label>Choose enveironment</label>
              <select value={env} onChange={e => setEnv(e.target.value)}>
                <option>Cheetah</option>
              </select>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Length of the episode, measured in frames</span>
              <label>Episode length</label>
              <input type='range' min='20' max='600' step='20' value={epLen} onChange={changer(setEpLen)}/>
              <output>{epLen}</output>
            </div>
          </div>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Algorithm</span>
        <div className='row'>
          <div className='column'>
            <div className='control-el tooltip'>
              <label># of agents</label>
              <span className='tooltiptext'>Number of agents in the population</span>
              <input type='range' min={numSelects} max='100' value={nAgents} onChange={changer(setNAgents)}/>
              <output>{nAgents}</output>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Number of agents that survive the elimination phase</span>
              <label># of survivors</label>
              <input type='range' min={numElites} max={nAgents-1} value={numSelects} onChange={changer(setNumSelects)}/>
              <output>{numSelects}</output>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Number of agents that are guaranteed to survive intact</span>
              <label># of elites</label>
              <input type='range' min='0' max={numSelects} value={numElites} onChange={changer(setNumElites)}/>
              <output>{numElites}</output>
            </div>
          </div>
          <div className='column'>
            <div className='control-el tooltip'>
              <label>Mutate elites?</label>
              <input type='checkbox' onChange={() => setMutateElites(b => !b)}/>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Probability of random mutation</span>
              <label>Mutation prob</label>
              <input type='range' min='0' max='1' step='0.05' value={mutationProb} onChange={changer(setMutationProb)}/>
              <output>{(mutationProb*100).toFixed(0)}</output>%
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Standard deviation of random Gaussian variable added to parameters</span>
              <label>Mutation rate</label>
              <input type='range' min='0' max='15' value={mutationRate} onChange={changer(setMutationRate)}/>
              <output>{mutationRateValues[mutationRate]}</output>
            </div>
          </div>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Animation</span>
        <div className='row'>
          <div className='column'>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Relative animation time. Choose 0 to skip animations.</span>
              <label>Animation time</label>
              <input type='range' min='0' max='2' step='0.01' value={animTime} onChange={changer(setAnimTime)}/>
              <output>{(animTime*100).toFixed(0)}</output>%
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>
                Number of physics loops between animation frames. Choose maximum value to fast-forward simulation
              </span>
              <label>Loops per frame</label>
              <input type='range' min='1' max={Math.min(epLen, 20)} value={loops} onChange={changer(setLoops)}/>
              <output>{loops}</output>
            </div>
          </div>
          <div className='column'>

          </div>
        </div>
      </div>
    </div>
  )
}
