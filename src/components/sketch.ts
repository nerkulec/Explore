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
    p.strokeWeight(0.01)
    if (p.keyIsDown(39)) {
      cheetahGame.update([1,-1,1,1,-1,1])
    } else if (p.keyIsDown(37)) {
      cheetahGame.update([-1,1,1,-1,1,-1])
    } else if (p.keyIsDown(38)) {
      cheetahGame.update([1,1,1,1,1,1])
    } else if (p.keyIsDown(40)) {
      cheetahGame.update([-1,-1,-1,-1,-1,-1])
    } else if (p.keyIsDown(32)) {
      cheetahGame.reset()
    } else {
      cheetahGame.update([0,0,0,0,0,0])
    }
    p.background(255)
    const w = 2
    const h = 2
    const dx = p.width/w+10
    const dy = p.height/h+10
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        p.push()
        p.translate(x*dx, y*dy)
        p.scale(1/w, 1/h)
        p.translate(p.width/2, p.height/2)
        cheetahGame.draw()
        p.pop()
      }
    }
  }
}

export default sketch