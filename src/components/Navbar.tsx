import React, { ReactElement } from 'react'
import './Navbar.css'

const changer = (setter: (v: any) => void) => 
  (event: React.ChangeEvent<HTMLInputElement>) => 
    setter(parseFloat(event.target.value))


export default function Navbar({
  env, setEnv, epLen, setEpLen, nAgents, setNAgents, animTime, setAnimTime,
  mutationRate, setMutationRate, mutationRateValues
}: {
  env: string, setEnv: (env: string) => void,
  epLen: number, setEpLen: (len: number) => void,
  nAgents: number, setNAgents: (len: number) => void,
  animTime: number, setAnimTime: (len: number) => void,
  mutationRate: number, setMutationRate: (len: number) => void,
  mutationRateValues: number[]
}): ReactElement {
  const element = (
    <div className='navbar'>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='navbar-box'>
          <label>Choose enveironment</label>
          <select value={env} onChange={e => setEnv(e.target.value)}>
            <option>Cheetah</option>
            <option>Ant</option>
            <option>Cat</option>
            <option>Elephant</option>
          </select>
          <label>Episode length</label>
          <input type='range' min='20' max='600' step='20' value={epLen} onChange={changer(setEpLen)}/>
          <output>{epLen}</output>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Algorithm</span>
        <div className='navbar-box'>
          <label># of agents</label>
          <input type='range' min='4' max='100' value={nAgents} onChange={changer(setNAgents)}/>
          <output>{nAgents}</output>
          <label>Mutation rate</label>
          <input type='range' min='0' max='12' value={mutationRate} onChange={changer(setMutationRate)}/>
          <output>{mutationRateValues[mutationRate]}</output>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Animation</span>
        <div className='navbar-box'>
          <label>Animation time</label>
          <input type='range' min='0' max='200' value={animTime} onChange={changer(setAnimTime)}/>
          <output>{animTime}</output>%
        </div>
      </div>
    </div>
  )
  return element
}
