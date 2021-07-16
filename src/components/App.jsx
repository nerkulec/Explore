import React, {useState} from "react"
import "./App.css"
// import ReactP5Wrapper from "react-p5-wrapper"
import { ReactP5Wrapper } from "./P5Wrapper"
import sketch from "./sketch"

export default function App() {
  const [rotation, setRotation] = useState(160)

  return (
    <ReactP5Wrapper sketch={sketch} rotation={rotation}>
      <input
        type="range"
        defaultValue={rotation}
        min="0"
        max="360"
        step="1"
        onChange={event => setRotation(parseInt(event.target.value, 10))}
      />
    </ReactP5Wrapper>
  )
}
