import { CheetahGame } from "../evo/Game"
import { P5Instance } from "./P5Wrapper"

const sketch = (p5: P5Instance) => {
  let cheetahGame = new CheetahGame(p5)

  p5.setup = () => {
    p5.createCanvas(1080, 720, p5.WEBGL)
    cheetahGame.reset()
  }

  p5.updateWithProps = props => {
    
  }

  p5.draw = () => {
    cheetahGame.update()
    cheetahGame.draw()
  }
}

export default sketch