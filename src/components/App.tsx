import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import RightSidebar from "./RightSidebar"
import sketch from "./sketch"
import { settingsType } from "./types"

const mutationRateValues = [
  0,
  0.0001, 0.0002, 0.0005,
  0.001, 0.002, 0.005,
  0.01, 0.02, 0.05,
  0.1, 0.2, 0.5,
  1, 2, 5
]

function App() {
  const [settings, setSettings] = useState<settingsType>({
    env: 'Mountain car',
    numAgents: 36,
    numAgentsToBe: 36,
    epLen: 200,
    animTimeCoef: 1,
    mutationRate: 7,
    mutationProb: 0.5,
    mutateElites: false,
    commaVariant: false,
    loops: 1,
    numElites: 4,
    numSelects: 18,
    numParents: 2,
    tournamentSize: 2,
    framesElites: 90,
    framesPerPair: 30,
    framesLosers: 90,
    framesPerCrossover: 30,
    framesMutation: 90,
    framesPermutation: 90,
    framesFadeIn: 20,
    showNN: false,
    advancedAnimation: false
  })
  const setSetting = (setting: keyof settingsType) => (value: any) => setSettings(settings => ({...settings, [setting]: value}))
  const setSettingCb = (setting: keyof settingsType) => (cb: (oldValue: any) => any) =>
    setSettings(settings => ({...settings, [setting]: cb(settings[setting])}))

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
  const [ageSinceMutation, setAgeSinceMutation] = useState(false)
  
  const setEnvWithReset = (env: string): void => {
    setQuantiles([[], [], [], [], []])
    setGensSinceCreated([[], [], [], [], []])
    setGensSinceMutated([[], [], [], [], []])
    setMutationSuccess([])
    setCrossoverSuccess([])
    setSetting('env')(env)
  }
  
  return <div className='root-wrapper'>
    <div className='title'>
      <span className='title-line'>Tinker with Neuro-Evolution in real time!</span><br/>
      <span className='title-line'>Evolve the cheetah to run 25m in 600 frames</span>
    </div>
    <Navbar
      setEnv={setEnvWithReset}
      mutationRateValues={mutationRateValues}
      settings={settings}
      setSetting={setSetting}
      setSettingCb={setSettingCb}
    />
    <div className="row">
      <div className="column left">
        
      </div>
      <div className="column middle">
        <P5Wrapper
          sketch={sketch}
          settings={{...settings, mutationRate: mutationRateValues[settings.mutationRate]}}

          appendQuantiles={appendQuantiles}
          appendGensSinceCreated={appendGensSinceCreated}
          appendGensSinceMutated={appendGensSinceMutated}
          appendMutationSuccess={appendMutationSuccess}
          appendCrossoverSuccess={appendCrossoverSuccess}
        />
      </div>
      <div className="column right">
        <RightSidebar
          quantiles={quantiles}
          mutationSuccess={mutationSuccess}
          crossoverSuccess={crossoverSuccess}
          gensSinceCreated={gensSinceCreated}
          gensSinceMutated={gensSinceMutated}
          ageSinceMutation={ageSinceMutation}
          setAgeSinceMutation={setAgeSinceMutation}
        />
      </div>
    </div>
  </div>
}

export default App
