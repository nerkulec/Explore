import React, { useMemo } from "react"
import { useState } from "react"
import Control from "../control/Control"
import { useD3 } from "../RightSidebar"
import MathJax from 'react-mathjax'
import {
  scaleLinear,
  range,
  scaleSequentialLog,
  extent,
  contours,
  geoPath,
  interpolatePlasma,
  scaleSequential
} from 'd3'

import "./Gaussian.css"
import "../App.css"
import { argsort, randn } from "../../evo/Evolution"
import { useEffect } from "react"
import { functions } from './Gaussian'
const { Provider, Node } = MathJax

const tex = (strings: TemplateStringsArray, ...values: (string | [string])[]): JSX.Element => {
  return <Provider>{values.reduce((final, value, index) => [
    ...final, typeof value === 'string' ? <Node formula={value} inline/> : <Node formula={value[0]}/>, <span>{strings[index+1]}</span>], [<span>{strings[0]}</span>] as JSX.Element[])}
  </Provider>
}

export type funType = {
  value: (x: number, y: number) => number
  optimum: [number, number]
  scale: 'log' | 'lin'
  thresholdRange: [number, number]
  div: number
  xDomain: number
  formula: JSX.Element
}




type Props = {
  
}

const Nes: React.FC<Props> = () => {
  const [fun, setFun] = useState('Rosenbrock')
  const [fitnessShaping, setFitnessShaping] = useState(false)
  const [sigma, setSigma] = useState(1)
  const [alpha, setAlpha] = useState(-5)
  const [points, setPoints] = useState<[number, number][]>([[0, 0], [randn(), randn()]])

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(points => {
        let [gradient, center] = points
        const lr = Math.pow(10, alpha)
        center[0] -= lr*gradient[0]
        center[1] -= lr*gradient[1]
        const newPoints: [number, number][] = [gradient, center]
        const randoms: [number, number][] = []
        for (let i=0; i<40; i++) {
          randoms.push([randn()*sigma, randn()*sigma])
        }
        const {value} = functions[fun]
        gradient = [0, 0]
        let values = []
        for (let i=0; i<40; i++) {
          const newPoint: [number, number] = [center[0]+randoms[i][0], center[1]+randoms[i][1]]
          newPoints.push(newPoint)
          values.push(value(...newPoint))
        }
        if (fitnessShaping) {
          const coef = 1/(values.length-1)
          const rank = argsort(values)
          for (let i=0; i<rank.length; i++) {
            values[rank[i]] = i*coef
          }
        }
        for (let i=0; i<40; i++) {
          gradient[0] += values[i]*randoms[i][0]
          gradient[1] += values[i]*randoms[i][1]
        }
        newPoints[0] = [gradient[0]/40, gradient[1]/40]
        return newPoints
      })
    }, 200)
    return () => clearInterval(interval)
  }, [points, setPoints, fun, fitnessShaping, alpha, sigma])

  const [grad, ...points_] = points

  return <div className="Gaussian">
    <h1>Fitness shaping - demo using NES</h1>
    <div>
      <label>Function: </label>
      <select value={fun} onChange={e => setFun(e.target.value)} style={{margin: 4}}>
        {Object.keys(functions).map(name => <option>{name}</option>)}        
      </select>
      {functions[fun].formula}
      <div className='row'>
        <div className='col'>
          <div className='row' style={{margin: 4}}>
            <Control min={0} max={2} step={0.01} label="" value={sigma} setValue={setSigma}>
              {tex`${'\\sigma='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <Control min={-8} max={2} step={0.1} label="" value={alpha} setValue={setAlpha}>
              {tex`${'\\log_{10}(\\alpha)='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <label>Fitness shaping (rank normalize)</label>
            <input type='checkbox' onChange={() => setFitnessShaping(b => !b)} checked={fitnessShaping} />
            {tex`${`f(X_{i:\\lambda}) := 1-\\frac{i-1}{\\lambda-1}`}`}
          </div>
          <div className='row' style={{margin: 4}}>
            <button type='button' onClick={() => setPoints(() => [[0, 0], [randn(), randn()]])}> Reset </button>
          </div>
        </div>
        <div style={{marginLeft: 10}}>
        {tex`${[`
          X_i \\sim \\mathcal{N}\\left(\\mu, 
            \\begin{bmatrix}
              \\sigma^2 & 0 \\\\
              0 &  \\sigma^2
            \\end{bmatrix}
          \\right)
          `]}`}
          {tex`${[`
          \\mu' = \\mu - \\alpha \\frac1n \\sum_{i=1}^n f(X_i)(X_i-\\mu)
            `]}`}
        </div>
      </div>
    </div>
    <div className='svg'>
      <Plot funInfo={functions[fun]} grad={grad} points={points_}/>
    </div>
  </div>
}

const Plot = ({grad, points, funInfo}: {
  grad: [number, number], points: [number, number][], funInfo: funType}) => {
  const width = 960
  const height = 720
    
  const margin = { top: 20, right: 20, bottom: 20, left: 20 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const { value, optimum: [xOpt, yOpt], scale, xDomain, thresholdRange, div } = funInfo

  const [center, ...randoms] = points

  const xScale = scaleLinear()
    .domain([xOpt-xDomain/2, xOpt+xDomain/2])
    .range([0, innerWidth])

  const yDomain = xDomain*0.75
  const yScale = scaleLinear()
    .domain([yOpt-yDomain/2, yOpt+yDomain/2])
    .range([innerHeight, 0])
  let thresholds
  let scaleSeq
  if (scale === 'log') {
    thresholds = range(thresholdRange[0], thresholdRange[1]).map(x => x/div).map(i => Math.pow(2, i))
    scaleSeq = scaleSequentialLog
  } else {
    thresholds = range(thresholdRange[0], thresholdRange[1]).map(x => x/div)
    scaleSeq = scaleSequential
  }
  const color = scaleSeq(extent(thresholds) as any, interpolatePlasma)
  const grid = useMemo(() => {
    const q = 6
    const x0 = -q / 2, x1 = width + 28 + q
    const y0 = -q / 2, y1 = height + q
    const n = Math.ceil((x1 - x0) / q)
    const m = Math.ceil((y1 - y0) / q)
    const grid = new Array(n * m) as any
    for (let j = 0; j < m; ++j) {
      for (let i = 0; i < n; ++i) {
        grid[j * n + i] = value(xScale.invert(i * q + x0), yScale.invert(j * q + y0))
      }
    }
    grid.x = -q
    grid.y = -q
    grid.k = q
    grid.n = n
    grid.m = m
    return grid
  }, [value, xScale, yScale])

  const transform = ({type, value, coordinates}:
    {type: string, value: (x: number, y: number) => number, coordinates: [number, number][][][]}) => ({
      type, value, coordinates: coordinates.map(rings => 
      rings.map(points => 
        points.map(([x, y]) => ([
          grid.x + grid.k * x,
          grid.y + grid.k * y
        ]))
      )
    )
  })
  
  const fcontours = contours()
    .size([grid.n, grid.m])
    .thresholds(thresholds)(grid)
    .map(transform as any)

  const circles = randoms.map(([x, y]) => ({
    x: xScale(x), y: yScale(y), r: 1.5, fill: '#000'
  }))

  const ref = useD3((svg: any) => {
    svg.select('.contour')
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-opacity', 0.2)
      .selectAll('path')
      .data(fcontours)
      .join('path')
        .attr('fill', (d: any) => color(d.value))
        .attr('d', geoPath())

  }, [fcontours])

  const gradScaling = 0.001

  return (
    <svg ref={ref as any} width={960} height={720}>
      <g id='main' transform={`translate(${margin.left}, ${margin.top})`}>
        <rect id='bg' width={innerWidth} height={innerHeight} fill='rgb(0, 0, 127)'/>
        <g className='contour' />
        <g className='dots'>
          <circle id='center' cx={xScale(center[0])} cy={yScale(center[1])} r='3' fill='#0F0'/>
          <line
            x1={xScale(center[0])}
            y1={yScale(center[1])}
            x2={xScale(center[0]-grad[0]*gradScaling)}
            y2={yScale(center[1]-grad[1]*gradScaling)}
            stroke='#0F0'
          />
          <circle id='optimum' cx={xScale(xOpt)} cy={yScale(yOpt)} r='3' fill='#F00'/>
        </g>
        <g id='elipses'>
          {
            circles.map(({x, y, fill, r}) => <circle cx={x} cy={y} r={r} fill={fill}/>)
          }
        </g>
      </g>
    </svg>
  )
}

export default Nes

