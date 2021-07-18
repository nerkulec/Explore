import { CheetahGame } from "../evo/Game"
import { P5Instance } from "./P5Wrapper"

const sketch = (p: P5Instance) => {
  let cheetahGame = new CheetahGame(p)

  p.setup = () => {
    p.createCanvas(1080, 720)
    cheetahGame.reset()
  }

  p.updateWithProps = props => {
    
  }

  p.draw = () => {
    // p.noStroke()
    cheetahGame.update()
    p.background(255)
    p.translate(p.width/2, p.height/2)
    p.translate(-cheetahGame.cheetah.torso.position.x, 0)
    cheetahGame.draw()
  }
}

export default sketch