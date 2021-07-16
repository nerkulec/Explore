export interface Agent {
  
}

type BodyDescription = {

}

abstract class PhysicsAgent implements Agent {
  constructor(bodyDesc: BodyDescription) {

  }
}

export class Cheetah extends PhysicsAgent {
  constructor() {
    super({
      
    })
  }
}
