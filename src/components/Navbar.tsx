import React, { ReactElement } from 'react'
import Control from './control/Control'
import './Navbar.css'
import { settingsType } from './types'


export default function Navbar({
  setEnv, settings, setSetting, setSettingCb, mutationRateValues
}: {
  setEnv: (env: string) => void
  settings: settingsType
  setSetting: (setting: keyof settingsType) => (value: any) => void
  setSettingCb: (setting: keyof settingsType) => (cb: (oldValue: any) => any) => void
  mutationRateValues: number[]
}): ReactElement {

  return (
    <div className='navbar'>
      <div className='navbar-column'>
        <span className='column-header'>Environment</span>
        <div className='row'>
          <div className='column'>
            <div className='control-el column'>
              <label>Choose RL environment</label>
              <select value={settings.env} onChange={e => setEnv(e.target.value)}>
                <option>Cheetah</option>
                <option>Acrobot</option>
                <option>Mountain car</option>
              </select>
            </div>
            <Control min={20} max={600} step={20} value={settings.epLen} setValue={setSetting('epLen')}
              label='Episode length'
              tooltip='Length of the episode, measured in frames'
            />
            <div className='control-el tooltip'>
              <span className='tooltiptext'>When unchecked, random perturbations are applied to the agent in the beginning of the episode</span>
              <label>Deterministic environment</label>
              <input type='checkbox' onChange={() => setSettingCb('deterministic')(b => !b)} checked={settings.deterministic} />
            </div>
          </div>
        </div>
      </div>
      <div className='navbar-column'>
        <span className='column-header'>Algorithm: (μ/ρ{settings.commaVariant ? ', ' : '+'}λ)-ES,
          μ={settings.numSelects}, ρ={settings.numParents}, λ={settings.numAgents}
          <div className='control-el tooltip'>
            <span className='tooltiptext'>ES Algorithm variant:<br/> (μ/ρ, λ)-ES vs  (μ/ρ+λ)-ES</span>
            <button className='button' onClick={() => setSettingCb('commaVariant')(b => !b)}>Switch variant</button>
          </div>        
        </span>
        <div className='row'>
          <div className='column'>
            <Control min={settings.numSelects} max={100} value={settings.numAgents} setValue={setSetting('numAgents')}
              label='Population size (λ)'
              tooltip='Number of agents in the population'
            />
            <Control min={Math.max(settings.numElites, 1)} max={settings.numAgents-1} value={settings.numSelects} setValue={setSetting('numSelects')}
              label='Number of survivors (μ)'
              tooltip='Number of agents that survive the elimination phase and can pass on their genes'
            />
            <Control min={0} max={settings.numSelects} value={settings.numElites} setValue={setSetting('numElites')}
              label='Elites'
              tooltip='Number of agents that are guaranteed to survive intact'
            />
          </div>
          <div className='column'>
            <Control min={1} max={settings.numSelects} value={settings.numParents} setValue={setSetting('numParents')}
              label='Number of parents (ρ)'
              tooltip='Number of parents involved in the procreation of an offspring - mixing coefficient'
            />
            <Control min={2} max={Math.min(settings.numSelects, 6)} value={settings.tournamentSize} setValue={setSetting('tournamentSize')}
              label='Tournament size'
              tooltip='Number of agents taking part in a single tournament round'
            />
          </div>
          <div className='column'>
            <Control min={0} max={100} step={5} value={settings.mutationProb} setValue={setSetting('mutationProb')}
              label='Mutation probability' unit='%'
              tooltip='Probability of random mutation'
            />
            <Control min={0} max={15} value={settings.mutationRate} setValue={setSetting('mutationRate')}
              showFn={x=>mutationRateValues[x].toString()}
              label='Mutation rate'
              tooltip='Standard deviation of random Gaussian variable added to parameters'
            />
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Whether to adapt the mutation rate of individuals</span>
              <label>Adapt mutation rate</label>
              <input type='checkbox' onChange={() => setSettingCb('adaptMutationRate')(b => !b)} checked={settings.adaptMutationRate} />
            </div>
          </div>
        </div>
      </div>
      <div className='navbar-column'>
        <span className='column-header'>Animation</span>
        <div className='row'>
          <div className='column'>
            <Control min={0} max={200} value={settings.animTimeCoef} setValue={setSetting('animTimeCoef')}
              label='Animation time' unit='%'
              tooltip='Relative animation time. Choose 0 to skip animations.'
            />
            <Control min={1} max={Math.min(settings.epLen, 20)} value={settings.loops} setValue={setSetting('loops')}
              label='Loops per frame'
              tooltip='Number of physics loops between animation frames. Choose maximum value to fast-forward simulation'
            />
            <div className='row'>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Blue means negative weights, red mean positive weights, green - close to 0</span>
                <label>Show NNs</label>
                <input type='checkbox' onChange={() => setSettingCb('showNN')(b => !b)} checked={settings.showNN} />
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Control each animation phase</span>
                <label>Advanced settings</label>
                <input type='checkbox' onChange={() => setSettingCb('advancedAnimation')(b => !b)} checked={settings.advancedAnimation}/>
              </div>
            </div>
          </div>
          <div className='column'>
            {settings.advancedAnimation ? <div className='column'>
              <Control min={0} max={120} value={settings.framesPermutation} setValue={setSetting('framesPermutation')}
                label='Permutation animation'
                tooltip='Length of the permutation animation phase'
              />
              <Control min={0} max={120} value={settings.framesElites} setValue={setSetting('framesElites')}
                label='Elites animation'
                tooltip='Length of the elites animation phase'
              />
              <Control min={0} max={60} value={settings.framesPerPair} setValue={setSetting('framesPerPair')}
                label='Selection animation'
                tooltip='Length of the one tournament selection animation'
              />
              <Control min={0} max={120} value={settings.framesLosers} setValue={setSetting('framesLosers')}
                label='Losers animation'
                tooltip='Length of the losers animation phase'
              />
              <Control min={0} max={60} value={settings.framesPerCrossover} setValue={setSetting('framesPerCrossover')}
                label='Crossover animation'
                tooltip='Length of the crossover animation phase'
              />
              <Control min={0} max={120} value={settings.framesMutation} setValue={setSetting('framesMutation')}
                label='Mutation animation'
                tooltip='Length of the mutation animation phase'
              />
            </div> : null }
          </div>
        </div>
      </div>
    </div>
  )
}