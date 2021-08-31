import React, {useEffect, useState} from "react"
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
    env: 'Cheetah',
    numAgents: 36,
    numAgentsToBe: 36,
    epLen: 200,
    animTimeCoef: 100,
    mutationRate: 7,
    mutationProb: 50,
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

  const [anchorTarget, setAnchorTarger] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAnchorTarger(document.getElementById('description'));
  }, [])

  const handleAnchorClick = (event: React.MouseEvent) => {
    event.preventDefault();
    anchorTarget?.scrollIntoView({behavior: 'smooth', block: 'start'})
  }
  
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
        <span className='title-line'>Tinker with Neuro-Evolution in real time!</span><br/>
        <span className='title-line'>{
          settings.env === 'Cheetah' ? 'Reach the furthest in 600 frames' :
          settings.env === 'Acrobot' ? 'Swing upwards in least amount of time' :
          settings.env === 'Mountain car' ? 'Climb the hill using the least amount of fuel' :
          null}
        </span>
      </div>
      <button className='button' onClick={handleAnchorClick}>Description below</button>
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
    <span className='description' id='description'>
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.

Vivamus mattis nec orci a gravida. Nam quis efficitur velit. Curabitur in elit sollicitudin, volutpat lorem tempor, congue nisi. Quisque accumsan lorem eget dictum consequat. Praesent mattis a augue eget euismod. Nulla id est et massa vestibulum pulvinar. Aenean orci odio, semper at posuere vitae, porttitor sit amet ligula. Phasellus vehicula, urna eget vestibulum cursus, velit justo scelerisque augue, eget ultricies mauris sem non sapien.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.

Vivamus mattis nec orci a gravida. Nam quis efficitur velit. Curabitur in elit sollicitudin, volutpat lorem tempor, congue nisi. Quisque accumsan lorem eget dictum consequat. Praesent mattis a augue eget euismod. Nulla id est et massa vestibulum pulvinar. Aenean orci odio, semper at posuere vitae, porttitor sit amet ligula. Phasellus vehicula, urna eget vestibulum cursus, velit justo scelerisque augue, eget ultricies mauris sem non sapien.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.

Vivamus mattis nec orci a gravida. Nam quis efficitur velit. Curabitur in elit sollicitudin, volutpat lorem tempor, congue nisi. Quisque accumsan lorem eget dictum consequat. Praesent mattis a augue eget euismod. Nulla id est et massa vestibulum pulvinar. Aenean orci odio, semper at posuere vitae, porttitor sit amet ligula. Phasellus vehicula, urna eget vestibulum cursus, velit justo scelerisque augue, eget ultricies mauris sem non sapien.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer placerat purus eu vestibulum luctus. Nullam ac ipsum ut ante vehicula ornare sed eget quam. In hac habitasse platea dictumst. Aliquam erat volutpat. Sed mauris dui, laoreet in odio eget, lobortis rutrum libero. Maecenas vitae quam et nunc gravida lacinia. Nullam ac enim ac odio bibendum eleifend. Sed eleifend justo quis consequat molestie. Proin vulputate libero lorem, ut luctus ligula mattis vitae. In hac habitasse platea dictumst. Donec pretium ligula non libero rhoncus, dapibus fringilla dui mollis. Pellentesque consectetur malesuada lobortis. Proin quis massa ante. Sed rhoncus congue lectus, et feugiat lectus volutpat at.

Vestibulum vitae sollicitudin eros. Sed tellus risus, luctus ac ipsum eu, dapibus suscipit nibh. Donec rhoncus tincidunt justo eget faucibus. Fusce metus sem, porta ut metus varius, placerat tincidunt enim. Duis tristique posuere nibh sed sagittis. Sed felis lectus, luctus sit amet mi vitae, pharetra elementum metus. Sed cursus tempus diam eu accumsan. Donec sed tempus ligula, id fringilla arcu. Donec massa turpis, tempus eu tempor in, convallis at diam. Mauris fringilla consectetur ipsum, vel fermentum augue malesuada nec.

Integer ante nulla, tempus a leo eget, aliquam semper quam. Pellentesque tempus nec justo sed rhoncus. Cras quis sapien accumsan, convallis nisl ac, euismod odio. Ut dolor mi, sollicitudin ut massa ac, sodales aliquet metus. Ut varius hendrerit nisi, id laoreet arcu. Integer sit amet nulla a lorem ornare gravida. Integer interdum euismod sem, nec tempus lectus dignissim ac.

Nam ultricies maximus tincidunt. Praesent leo libero, porta sit amet euismod a, gravida id odio. Morbi libero mi, posuere vehicula sem ut, ornare ullamcorper turpis. Maecenas sed lacus ac velit pretium volutpat eget vel nisl. Aliquam erat volutpat. Donec dapibus consequat nisi eu maximus. Duis at cursus tortor, porttitor commodo eros. Ut quis lectus sagittis, finibus risus vel, sollicitudin tellus.

Morbi eu leo ac turpis pretium auctor sit amet sodales lectus. Pellentesque iaculis lectus ut lorem ultrices molestie quis non purus. Nunc efficitur cursus eleifend. In augue enim, dapibus et placerat vel, malesuada in leo. Duis non sem justo. Duis eget dictum est. In hac habitasse platea dictumst. Praesent egestas arcu in risus consectetur, ut sollicitudin turpis sodales. Nam ultricies lectus sed erat consectetur, in elementum ligula ullamcorper. Mauris dolor lorem, luctus non leo ut, mattis sodales velit.

Curabitur ac mi eu magna laoreet placerat. Cras varius tellus ipsum, ac rhoncus justo dignissim dapibus. Duis nec tortor ante. Integer tincidunt, libero eget maximus condimentum, sapien dolor gravida augue, vitae finibus erat nisl at ante. Duis sit amet dignissim enim. Nam ac malesuada augue. Curabitur dictum lectus sed porttitor faucibus. Donec lobortis tincidunt elit vitae convallis. Suspendisse cursus ac quam vel fermentum. Vivamus in sapien sed risus ultrices vestibulum. Nam id metus venenatis, porta odio quis, ultrices dui.

Vivamus mattis nec orci a gravida. Nam quis efficitur velit. Curabitur in elit sollicitudin, volutpat lorem tempor, congue nisi. Quisque accumsan lorem eget dictum consequat. Praesent mattis a augue eget euismod. Nulla id est et massa vestibulum pulvinar. Aenean orci odio, semper at posuere vitae, porttitor sit amet ligula. Phasellus vehicula, urna eget vestibulum cursus, velit justo scelerisque augue, eget ultricies mauris sem non sapien.
</span>
  </div>
}

export default App
