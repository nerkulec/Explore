import React, {useState} from "react"
import "./App.css"
import P5Wrapper from "react-p5-wrapper"

const sketch = p => {
  let rotation = 0
  p.setup = () => p.createCanvas(600, 400, p.WEBGL)

  p.myCustomRedrawAccordingToNewPropsHandler = props => {
    if (props.rotation) rotation = (props.rotation * Math.PI) / 180
  }

  p.draw = () => {
    p.background(100)
    p.normalMaterial()
    p.noStroke()

    p.push()
    p.translate(-40, 50)
    p.rotateY(rotation)
    p.rotateX(-0.9)
    p.box(100)
    p.pop()

    p.noFill()
    p.stroke(255)
    p.push()
    p.translate(400, p.height * 0.35, -200)
    p.sphere(300)
    p.pop()
  }
}

export default function App() {
  const [rotation, setRotation] = useState(160)

  return <>
    <P5Wrapper sketch={sketch} rotation={rotation}>
    <input
        type="range"
        defaultValue={rotation}
        min="0"
        max="360"
        step="1"
        onChange={event =>
          setRotation(parseInt(event.target.value, 10))
        }
        className='input'
      />
    </P5Wrapper>
    
    </>
}

