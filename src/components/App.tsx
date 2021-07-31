import React, {useState} from "react"
import "./App.css"
import Navbar from "./Navbar"
import { P5Wrapper } from "./P5Wrapper"
import sketch from "./sketch"

function App() {
  return <>
    <Navbar
    
    />
    <P5Wrapper sketch={sketch}

    />
  </>
}

export default App
