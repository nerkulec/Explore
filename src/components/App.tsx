import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import { tex } from "./questions"
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
    env: 'Cheetah',
    deterministic: true,
    numAgents: 25,
    numAgentsToBe: 25,
    epLen: 600,
    animTimeCoef: 100,
    mutationRate: 13,
    mutationProb: 100,
    mutateElites: false,
    adaptMutationRate: false,
    commaVariant: false,
    loops: 1,
    numElites: 1,
    numSelects: 6,
    numParents: 2,
    tournamentSize: 4,
    framesElites: 90,
    framesPerPair: 40,
    framesLosers: 90,
    framesPerCrossover: 40,
    framesMutation: 90,
    framesPermutation: 90,
    framesFadeIn: 20,
    showNN: true,
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

  // const [anchorTarget, setAnchorTarger] = useState<HTMLElement | null>(null);

  // useEffect(() => {
  //   setAnchorTarger(document.getElementById('description'));
  // }, [])

  // const handleAnchorClick = (event: React.MouseEvent) => {
  //   event.preventDefault();
  //   anchorTarget?.scrollIntoView({behavior: 'smooth', block: 'start'})
  // }
  
  const setEnvWithReset = (env: string): void => {
    setQuantiles([[], [], [], [], []])
    setGensSinceCreated([[], [], [], [], []])
    setGensSinceMutated([[], [], [], [], []])
    setMutationSuccess([])
    setCrossoverSuccess([])
    setSetting('env')(env)
  }
  
  return <div className='root-wrapper'>
    <div className='header'>
      <div className='title'>
        <span className='title-line'>Tinker with Evolution Strategies (ES) in real time!</span><br/>
        {/* <span className='title-line'>{
          settings.env === 'Cheetah' ? 'Reach the furthest in 600 frames' :
          settings.env === 'Acrobot' ? 'Swing upwards in least amount of time' :
          settings.env === 'Mountain car' ? 'Climb the hill using the least amount of fuel' :
          null}
        </span> */}
      </div>
      {/* <button className='button' onClick={handleAnchorClick}>What is this?</button> */}
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
        <h2>Materials on Evolution Strategies in Reinforcement Learning:</h2>
        <a href='https://openai.com/blog/evolution-strategies/' className='link'>
          Evolution Strategies as a
          Scalable Alternative to
          Reinforcement Learning [OpenAI]
        </a>
        <a href='https://eng.uber.com/deep-neuroevolution/' className='link'>
          Welcoming the Era of Deep Neuroevolution [UberAI]
        </a>
        
        <h2>Additional demos:</h2>
        <a href='/correlation-matrix' className='link'>See the effect of changing the mutation distribution - demo using {tex`${`(1, \\lambda)`}-ES`}</a>
        <a href='/nes' className='link'>See how fitness shaping affects convergence and robustness - demo using NES</a>
        <a href='/cma-es' className='link'>See self-adaptation at work - demo using CMA-ES</a>
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
