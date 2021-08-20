import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import RightSidebar from "./RightSidebar"
import sketch from "./sketch"

const mutationRateValues = [
  0,
  0.0001, 0.0002, 0.0005,
  0.001, 0.002, 0.005,
  0.01, 0.02, 0.05,
  0.1, 0.2, 0.5,
  1, 2, 5
]

function App() {
  const [env, setEnv] = useState('Cheetah')
  const [epLen, setEpLen] = useState(200)
  const [nAgents, setNAgents] = useState(36)
  const [mutationRate, setMutationRate] = useState(10)
  const [mutationProb, setMutationProb] = useState(0.5)
  const [mutateElites, setMutateElites] = useState(false)
  const [animTime, setAnimTime] = useState(1)
  const [loops, setLoops] =  useState(1)
  const [numElites, setNumElites] =  useState(4)
  const [numSelects, setNumSelects] =  useState(18)

  const [rewards, setRewards] = useState([] as number[])
  const [medians, setMedians] = useState([] as number[])
  const [stds, setStds] = useState([] as number[])
  const [correlations, setCorrelations] = useState([] as number[])
  const appendReward = (new_reward: number) => setRewards(reward => [...reward, new_reward])
  const appendMedian = (new_median: number) => setMedians(median => [...median, new_median])
  const appendStd = (new_std: number) => setStds(std => [...std, new_std])
  const appendCorrelation = (new_corr: number) => setCorrelations(corr => [...corr, new_corr])
  
  return <div className='root-wrapper'>
    <div className='title'>
      <span className='title-line'>Tinker with Neuro-Evolution in real time!</span><br/>
      <span className='title-line'>Evolve the cheetah to run 25m in 600 frames</span>
    </div>
    <Navbar
      env={env} setEnv={setEnv}
      epLen={epLen} setEpLen={setEpLen}
      nAgents={nAgents} setNAgents={setNAgents}
      animTime={animTime} setAnimTime={setAnimTime}
      mutationRate={mutationRate} setMutationRate={setMutationRate}
      mutationRateValues={mutationRateValues}
      mutationProb={mutationProb} setMutationProb={setMutationProb}
      setMutateElites={setMutateElites}
      loops={loops} setLoops={setLoops}
      numElites={numElites} setNumElites={setNumElites}
      numSelects={numSelects} setNumSelects={setNumSelects}
    />
    <div className="row">
      <div className="column left">
        
      </div>
      <div className="column middle">
        <P5Wrapper
          sketch={sketch}
          env={env}
          epLen={epLen}
          nAgents={nAgents}
          animTime={animTime}
          mutationRate={mutationRateValues[mutationRate]}
          mutationProb={mutationProb}
          mutateElites={mutateElites}
          appendReward={appendReward}
          appendMedian={appendMedian}
          appendStd={appendStd}
          appendCorrelation={appendCorrelation}
          loops={loops}
          numElites={numElites}
          numSelects={numSelects}
        />
      </div>
      <div className="column right">
        <RightSidebar
          rewards={rewards}
          medians={medians}
          stds={stds}
          correlations={correlations}
        />
      </div>
    </div>
  </div>
}

export default App
