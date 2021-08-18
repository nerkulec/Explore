import React, { ReactElement } from 'react'
import './Navbar.css'

const changer = (setter: (v: any) => void) => 
  (event: React.ChangeEvent<HTMLInputElement>) => 
    setter(parseFloat(event.target.value))


export default function Navbar({
  env, setEnv, epLen, setEpLen, nAgents, setNAgents, animTime, setAnimTime,
  mutationRate, setMutationRate, mutationRateValues, loops, setLoops,
  numElites, setNumElites, numSelects, setNumSelects}: {
  env: string, setEnv: (env: string) => void,
  epLen: number, setEpLen: (len: number) => void,
  nAgents: number, setNAgents: (len: number) => void,
  animTime: number, setAnimTime: (len: number) => void,
  mutationRate: number, setMutationRate: (len: number) => void,
  mutationRateValues: number[],
  loops: number, setLoops: (n: number) => void,
  numElites: number, setNumElites: (n: number) => void,
  numSelects: number, setNumSelects: (n: number) => void,
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
                <option>Ant</option>
                <option>Cat</option>
                <option>Elephant</option>
              </select>
            </div>
            <div className='control-el'>
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
            <div className='control-el'>
              <label># of agents</label>
              <input type='range' min='4' max='100' value={nAgents} onChange={changer(setNAgents)}/>
              <output>{nAgents}</output>
            </div>
            <div className='control-el'>
              <label># of elites</label>
              <input type='range' min='0' max={nAgents} value={numElites} onChange={changer(setNumElites)}/>
              <output>{numElites}</output>
            </div>
            <div className='control-el'>
              <label># of selects</label>
              <input type='range' min='0' max={nAgents} value={numSelects} onChange={changer(setNumSelects)}/>
              <output>{numSelects}</output>
            </div>
          </div>

          <div className='column'>
            <div className='control-el'>
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
            <div className='control-el'>
              <label>Animation time</label>
              <input type='range' min='0' max='200' value={animTime} onChange={changer(setAnimTime)}/>
              <output>{animTime}</output>%
            </div>
            <div className='control-el'>
              <label>Loops per frame</label>
              <input type='range' min='1' max={Math.min(epLen, 20)} value={loops} onChange={changer(setLoops)}/>
              <output>{loops}</output>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
