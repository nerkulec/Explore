import React from "react"
import "./App.css"
import p5 from "p5"
import p5w from "react-p5-wrapper"
const P5Wrapper = p5w.default
console.log(p5w)

function App() {
  const sketch = (p: p5) => {
    let rotation = 0;

    p.setup = () => p.createCanvas(600, 400, p.WEBGL);

    p.updateWithProps = props => {
      if (props.rotation) rotation = (props.rotation * Math.PI) / 180;
    };

    p.draw = () => {
      p.background(100);
      p.normalMaterial();
      p.noStroke();
      p.push();
      p.rotateY(rotation);
      p.box(100);
      p.pop();
    };
  }

  return <P5Wrapper sketch={sketch}/>
}

export default App

