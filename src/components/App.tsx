import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import RightSidebar from "./RightSidebar"
import sketch from "./sketch"

const mutationRateValues = [
  0, 0.001, 0.002, 0.005,
  0.01, 0.02, 0.05,
  0.1, 0.2, 0.5,
  1, 2, 5
]

function App() {
  const [env, setEnv] = useState('Cheetah')
  const [epLen, setEpLen] = useState(200)
  const [nAgents, setNAgents] = useState(36)
  const [mutationRate, setMutationRate] = useState(7)
  const [animTime, setAnimTime] = useState(100)

  const [rewards, setRewards] = useState([] as number[][])
  const appendRewards = (new_rewards: number[]) => setRewards(rewards => [...rewards, new_rewards])
  return <>
    <Navbar
      env={env} setEnv={setEnv}
      epLen={epLen} setEpLen={setEpLen}
      nAgents={nAgents} setNAgents={setNAgents}
      animTime={animTime} setAnimTime={setAnimTime}
      mutationRate={mutationRate} setMutationRate={setMutationRate}
      mutationRateValues={mutationRateValues}
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
          appendRewards={appendRewards}
        />
      </div>
      <div className="column right">
        <RightSidebar
          rewards={rewards}
        />
      </div>
    </div>
  </>
}

export default App
