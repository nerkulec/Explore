import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import sketch from "./sketch"

function App() {
  const [env, setEnv] = useState('Cheetah')
  const [epLen, setEpLen] = useState(600)
  const [nAgents, setNAgents] = useState(36)
  const [animTime, setAnimTime] = useState(100)
  return <>
    <Navbar
      env={env} setEnv={setEnv}
      epLen={epLen} setEpLen={setEpLen}
      nAgents={nAgents} setNAgents={setNAgents}
      animTime={animTime} setAnimTime={setAnimTime}
    />
    <P5Wrapper sketch={sketch}
      env={env}
      epLen={epLen}
      nAgents={nAgents}
      animTime={animTime}
    />
  </>
}

export default App
