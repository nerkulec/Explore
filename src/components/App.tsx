import React, {useState} from "react"
import "./App.css"
import { P5Wrapper } from "./P5Wrapper"
import sketch from "./sketch"

function App() {
  const [rotation, setRotation] = useState(180)
  return <>
    <P5Wrapper sketch={sketch} rotation={rotation}/>
    <input
        type="range"
        defaultValue={rotation}
        min="0"
        max="360"
        step="1"
        onChange={event => setRotation(parseInt(event.target.value, 10))}
    />
  </>
}

export default App
