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
    if (p.keyIsDown(37)) {
      cheetahGame.update([1,-1,1,1,-1])
    } else if (p.keyIsDown(39)) {
      cheetahGame.update([-1,1,1,-1, 1])
    } else {
      cheetahGame.update([0,0,0,0,0])
    }
    p.background(255)
    p.translate(p.width/2, p.height/2)
    p.translate(-cheetahGame.cheetah.torso.position.x, 0)
    cheetahGame.draw()
  }
}

export default sketch