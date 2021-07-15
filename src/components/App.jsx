import React, {useState} from "react"
import "./App.css"
import ReactP5Wrapper from "react-p5-wrapper"
// import sketch from "./sketch"

const sketch = p5 => {
  let rotation = 0
  let rot_z = 0

  p5.setup = () => p5.createCanvas(300, 300, p5.WEBGL)

  p5.myCustomRedrawAccordingToNewPropsHandler = props => {
    if (props.rotation) {
      rotation = (props.rotation * Math.PI) / 180
    }
  }

  p5.draw = () => {
    rot_z += 0.02
    p5.background(100)
    p5.normalMaterial()
    p5.noStroke()

    p5.push()
    p5.translate(-40, 50)
    p5.rotateY(rotation)
    p5.rotateX(-0.9)
    p5.rotateZ(rot_z)
    p5.box(100)
    p5.pop()

    p5.noFill()
    p5.stroke(255)
    p5.push()
    p5.translate(400, p5.height * 0.35, -200)
    p5.sphere(300)
    p5.pop()
  }
}

export default function App() {
  const [rotation, setRotation] = useState(160);

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
