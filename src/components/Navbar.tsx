import React, { ReactElement } from 'react'
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

  const changer = (setting: keyof settingsType) => 
    (event: React.ChangeEvent<HTMLInputElement>) => 
      setSetting(setting)(parseFloat(event.target.value))

  return (
    <div className='navbar'>
      <div className='navbar-column'>
        <span>Environment</span>
        <div className='row'>
          <div className='column'>
            <div className='control-el'>
              <label>Choose enveironment</label>
              <select value={settings.env} onChange={e => setEnv(e.target.value)}>
                <option>Cheetah</option>
                <option>Acrobot</option>
                <option>Mountain car</option>
              </select>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Length of the episode, measured in frames</span>
              <label>Episode length</label>
              <input type='range' min='20' max='600' step='20' value={settings.epLen} onChange={changer('epLen')}/>
              <output>{settings.epLen}</output>
            </div>
          </div>
        </div>
      </div>
      <div className='navbar-column'>
        <span>Algorithm: ({settings.numSelects}/{settings.numParents}{settings.commaVariant ? ', ' : '+'}{settings.numAgents})-ES
          <div className='control-el tooltip'>
            <span className='tooltiptext'>ES Algorithm variant</span>
            <button onClick={() => setSettingCb('commaVariant')(b => !b)}>Switch</button>
          </div>        
        </span>
        <div className='row'>
          <div className='column'>
            <div className='control-el tooltip'>
              <label>Population size</label>
              <span className='tooltiptext'>Number of agents in the population</span>
              <input type='range' min={settings.numSelects} max='100' value={settings.numAgents} onChange={changer('numAgents')}/>
              <output>{settings.numAgents}</output>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Number of agents that survive the elimination phase and can pass on their genes</span>
              <label>Number of survivors</label>
              <input type='range' min={Math.max(settings.numElites, 1)} max={settings.numAgents-1}
                value={settings.numSelects} onChange={changer('numSelects')}/>
              <output>{settings.numSelects}</output>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Number of agents that are guaranteed to survive intact</span>
              <label>Elites</label>
              <input type='range' min='0' max={settings.numSelects} value={settings.numElites} onChange={changer('numElites')}/>
              <output>{settings.numElites}</output>
            </div>
          </div>
          <div className='column'>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Number of parents involved in the procreation of an offspring</span>
              <label>Number of parents</label>
              <input type='range' min='1' max={settings.numSelects} value={settings.numParents} onChange={changer('numParents')}/>
              <output>{settings.numParents}</output>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'></span>
              <label>Tournament size</label>
              <input type='range' min='2' max={Math.min(settings.numSelects, 6)} value={settings.tournamentSize}
                onChange={changer('tournamentSize')}/>
              <output>{settings.tournamentSize}</output>
            </div>
          </div>
          <div className='column'>
            <div className='control-el tooltip'>
              <label>Mutate elites?</label>
              <input type='checkbox' onChange={() => setSettingCb('mutateElites')(b => !b)}/>
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Probability of random mutation</span>
              <label>Mutation prob</label>
              <input type='range' min='0' max='1' step='0.05' value={settings.mutationProb} onChange={changer('mutationProb')}/>
              <output>{(settings.mutationProb*100).toFixed(0)}</output>%
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>Standard deviation of random Gaussian variable added to parameters</span>
              <label>Mutation rate</label>
              <input type='range' min='0' max='15' value={settings.mutationRate} onChange={changer('mutationRate')}/>
              <output>{mutationRateValues[settings.mutationRate]}</output>
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
              <input type='range' min='0' max='2' step='0.01' value={settings.animTimeCoef} onChange={changer('animTimeCoef')}/>
              <output>{(settings.animTimeCoef*100).toFixed(0)}</output>%
            </div>
            <div className='control-el tooltip'>
              <span className='tooltiptext'>
                Number of physics loops between animation frames. Choose maximum value to fast-forward simulation
              </span>
              <label>Loops per frame</label>
              <input type='range' min='1' max={Math.min(settings.epLen, 20)} value={settings.loops} onChange={changer('loops')}/>
              <output>{settings.loops}</output>
            </div>
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
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the elites animation phase</span>
                <label>Elites animation</label>
                <input type='range' min='0' max='120' value={settings.framesElites} onChange={changer('framesElites')}/>
                <output>{settings.framesElites}</output>
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the one tournament selection animation</span>
                <label>Selection animation</label>
                <input type='range' min='0' max='40' value={settings.framesPerPair} onChange={changer('framesPerPair')}/>
                <output>{settings.framesPerPair}</output>
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the losers animation phase</span>
                <label>Losers animation</label>
                <input type='range' min='0' max='120' value={settings.framesLosers} onChange={changer('framesLosers')}/>
                <output>{settings.framesLosers}</output>
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the crossover animation phase</span>
                <label>Crossover animation</label>
                <input type='range' min='0' max='40' value={settings.framesPerCrossover} onChange={changer('framesPerCrossover')}/>
                <output>{settings.framesPerCrossover}</output>
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the mutation animation phase</span>
                <label>Mutation animation</label>
                <input type='range' min='0' max='120' value={settings.framesMutation} onChange={changer('framesMutation')}/>
                <output>{settings.framesMutation}</output>
              </div>
              <div className='control-el tooltip'>
                <span className='tooltiptext'>Length of the permutation animation phase</span>
                <label>Permutation animation</label>
                <input type='range' min='0' max='120' value={settings.framesPermutation} onChange={changer('framesPermutation')}/>
                <output>{settings.framesPermutation}</output>
              </div>
            </div> : null }
          </div>
        </div>
      </div>
    </div>
  )
}
