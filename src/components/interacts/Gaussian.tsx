import React from "react"
import { useState } from "react"
import Control from "../control/Control"
import { useD3 } from "../RightSidebar"
import {
  select,
  scaleLinear,
  axisRight,
  axisBottom,
  line,
  range
} from 'd3'

import "./Gaussian.css"
import "../App.css"
import { randn } from "../../evo/Evolution"
import { v2 } from "../../evo/Agent"
import { useEffect } from "react"
import MathJax from "react-mathjax"

const GaussianPlot = ({matrix, randoms}: {matrix: number[], randoms: [number, number][]}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const xScale = scaleLinear()
      .domain([-16, 16])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([-12, 12])
      .range([innerHeight, 0])
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const areaGenerator = line()
      .x(([x, y]) => xScale(x as any))
      .y(([x, y]) => yScale(y as any))

    const n = randoms.length

    const m = 100
    const radiai = [10, 8, 6, 4, 2]
    for (let i = 0; i < 5; i++) {
      const radius = radiai[i]
      const area = areaGenerator(range(m).map(i => {
        const angle = 2*Math.PI*i/m
        return [radius*Math.cos(angle), radius*Math.sin(angle)]
      }))
      g.select(`#area-${i}`)
        .attr('d', area)
    }
    const data = randoms.map(([x, y]) => {
      return [matrix[0]*x+matrix[2]*y, matrix[1]*x+matrix[3]*y]
    })
    g.selectAll("circle")
      .remove()

    g.selectAll("circle")
      .data(data)
      // .enter()
      .join("circle")
        .attr("cx", ([x, y]: v2) => xScale(x))
        .attr("cy", ([x, y]: v2) => yScale(y))
        .attr("r", 1.5)
        .style("fill", "#ff0000")

  }, [matrix, randoms])

  return (
    <svg ref={ref as any} width={480} height={360}>
      <g>
        <path id='area-0' className='area-0'/>
        <path id='area-1' className='area-1'/>
        <path id='area-2' className='area-2'/>
        <path id='area-3' className='area-3'/>
        <path id='area-4' className='area-4'/>
      </g>
    </svg>
  )
}


type Props = {
  
}

// !!! A FULL
const Gaussian: React.FC<Props> = ({
  
}) => {
  const [matrix, setMatrix] = useState(() => [1, 0, 0, 1])
  const [randoms, setRandoms] = useState<[number, number][]>(() => [])

  const setNth = (index: number) => (value: number) => setMatrix(matrix => {
    const newMatrix = [...matrix]
    newMatrix[index] = value
    return newMatrix
  })

  useEffect(() => {
    setInterval(() => {
      const randoms: [number, number][] = []
      for (let i=0; i<100; i++) {
        randoms.push([randn(), randn()])
      }
      setRandoms(randoms)
    }, 100)
  }, [setRandoms])

  return <div className="Gaussian">
    <MathJax.Provider>
      <MathJax.Node formula={`\\begin{bmatrix}
      ${matrix[0].toFixed(1)} & ${matrix[1].toFixed(1)} \\\\ ${matrix[2].toFixed(1)} & ${matrix[3].toFixed(1)}
      \\end{bmatrix}`}/>
    </MathJax.Provider>
    <div className='row'>
      <Control min={-10} max={10} step={0.1} label="" value={matrix[0]} setValue={setNth(0)}/>
      <Control min={-10} max={10} step={0.1} label="" value={matrix[1]} setValue={setNth(1)}/>
    </div>
    <div className='row'>
      <Control min={-10} max={10} step={0.1} label="" value={matrix[2]} setValue={setNth(2)}/>
      <Control min={-10} max={10} step={0.1} label="" value={matrix[3]} setValue={setNth(3)}/>
    </div>
    <div className='svg'>
      <GaussianPlot matrix={matrix} randoms={randoms}/>
    </div>
  </div>
}

export default Gaussian

