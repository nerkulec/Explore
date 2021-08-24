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
  const [advancedAnimation, setAdvancedAnimation] = useState(false)
  const [showNN, setShowNN] = useState(false)
  const [framesElites, setFramesElites] = useState(90)
  const [framesPerPair, setFramesPerPair] = useState(30)
  const [framesLosers, setFramesLosers] = useState(90)
  const [framesPerCrossover, setFramesPerCrossover] = useState(30)
  const [framesMutation, setFramesMutation] = useState(90)
  const [framesPermutation, setFramesPermutation] = useState(90)
  const [framesFadeIn, setFramesFadeIn] = useState(20)

  const [quantiles, setQuantiles] = useState([[], [], [], [], []] as number[][])
  const [gensSinceCreated, setGensSinceCreated] = useState([[], [], [], [], []] as number[][])
  const [gensSinceMutated, setGensSinceMutated] = useState([[], [], [], [], []] as number[][])
  const [mutationSuccess, setMutationSuccess] = useState([] as number[])
  const [crossoverSuccess, setCrossoverSuccess] = useState([] as number[])
  const appendQuantiles = (nq: number[]) => setQuantiles(qs => qs.map((q, i) => [...q, nq[i]]))
  const appendGensSinceCreated = (nq: number[]) => setGensSinceCreated(qs => qs.map((q, i) => [...q, nq[i]]))
  const appendGensSinceMutated = (nq: number[]) => setGensSinceMutated(qs => qs.map((q, i) => [...q, nq[i]]))
  const appendMutationSuccess = (ms: number) => setMutationSuccess(mss => [...mss, ms])
  const appendCrossoverSuccess = (ms: number) => setCrossoverSuccess(mss => [...mss, ms])
  
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
      advancedAnimation={advancedAnimation} setAdvancedAnimation={setAdvancedAnimation}
      showNN={showNN} setShowNN={setShowNN}
      framesElites={framesElites} setFramesElites={setFramesElites}
      framesPerPair={framesPerPair} setFramesPerPair={setFramesPerPair}
      framesLosers={framesLosers} setFramesLosers={setFramesLosers}
      framesPerCrossover={framesPerCrossover} setFramesPerCrossover={setFramesPerCrossover}
      framesMutation={framesMutation} setFramesMutation={setFramesMutation}
      framesPermutation={framesPermutation} setFramesPermutation={setFramesPermutation}
      framesFadeIn={framesFadeIn} setFramesFadeIn={setFramesFadeIn}
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
          appendQuantiles={appendQuantiles}
          appendGensSinceCreated={appendGensSinceCreated}
          appendGensSinceMutated={appendGensSinceMutated}
          appendMutationSuccess={appendMutationSuccess}
          appendCrossoverSuccess={appendCrossoverSuccess}
          loops={loops}
          numElites={numElites}
          numSelects={numSelects}
          framesElites={framesElites}
          framesPerPair={framesPerPair}
          framesLosers={framesLosers}
          framesPerCrossover={framesPerCrossover}
          framesMutation={framesMutation}
          framesPermutation={framesPermutation}
          framesFadeIn={framesFadeIn}
          showNN={showNN}
        />
      </div>
      <div className="column right">
        <RightSidebar
          quantiles={quantiles}
          mutationSuccess={mutationSuccess}
          crossoverSuccess={crossoverSuccess}
          gensSinceCreated={gensSinceCreated}
          gensSinceMutated={gensSinceMutated}
        />
      </div>
    </div>
  </div>
}

export default App
