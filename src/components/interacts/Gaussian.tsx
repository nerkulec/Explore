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
import { randn } from "../../evo/Evolution"
import { useEffect } from "react"
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
const TwoPI = 2*Math.PI
export const functions: {
  [key: string]: funType
} = {
  Rosenbrock: {
    value: (x, y) => (1-x)**2+100*(y-x**2)**2,
    optimum: [1, 1],
    scale: 'log',
    thresholdRange: [-1, 20],
    div: 1,
    xDomain: 8,
    formula: tex`${`f(x, y) = (1-x)^2+100(y-x^2)^2`}`
  },
  Rastrigin: {
    value: (x, y) => 20+x**2+y**2-10*Math.cos(TwoPI*x)-10*Math.cos(TwoPI*y),
    optimum: [0, 0],
    scale: 'log',
    thresholdRange: [-4, 20],
    div: 3,
    xDomain: 10,
    formula: tex`${`f(x, y) = x^2+y^2-10 \\cos(2\\pi x) -10 \\cos(2\\pi y)`}`
  },
  Beale: {
    // value: (x, y) => -20*Math.exp(-0.2*Math.sqrt(0.5*(x^2+y^2)))-Math.exp(0.5*(Math.cos(TwoPI*x)+Math.cos(TwoPI*y))) + Math.E + 20,
    value: (x, y) => (1.5-x+x*y)**2 + (2.25-x+x*y**2)**2+(2.625-x+x*y**3)**2,
    optimum: [3, 0.5],
    scale: 'log',
    thresholdRange: [-10, 20],
    div: 1,
    xDomain: 10,
    formula: tex`${`f(x, y) = (1.5-x+xy)^2+(2.25-x+xy^2)^2+(2.625-x+xy^3)^2`}`
  }

}




type Props = {
  
}

const Gaussian: React.FC<Props> = () => {
  const [fun, setFun] = useState('Rosenbrock')
  const [matrix, setMatrix] = useState(() => [1, 1, 0])
  const [points, setPoints] = useState<[number, number][]>(() => [[randn(), randn()]])
  const sqrt = useMemo(() => {
    const sigma1 = matrix[0]
    const sigma2 = matrix[1]
    const c = Math.cos(matrix[2])
    const s = Math.sin(matrix[2])
    return [c*sigma1, s*sigma1, -s*sigma2, c*sigma2]
  }, [matrix])

  const setNth = (index: number) => (value: number) => setMatrix(matrix => {
    const newMatrix = [...matrix]
    newMatrix[index] = value
    return newMatrix
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(points => {
        let [center, ...rest] = points
        const {value} = functions[fun]
        if (rest.length > 0) {
          const [newCenter, ]: [[number, number], number] = rest.reduce(([best, bestValue], [x, y]) => {
            const v = value(x, y)
            if (value(x, y) < bestValue) {
              return [[x, y], v]
            } else {
              return [best, bestValue]
            }
          }, [rest[0], value(...rest[0])])
          center = newCenter
        }
        const newPoints: [number, number][] = [center]
        for (let i=0; i<40; i++) {
          const dx = randn()
          const dy = randn()
          newPoints.push([
            center[0]+sqrt[0]*dx+sqrt[2]*dy,
            center[1]+sqrt[1]*dx+sqrt[3]*dy
          ])
        }
        return newPoints
      })
    }, 200)
    return () => clearInterval(interval)
  }, [points, setPoints, fun, sqrt])

  const twoPi = Math.floor(Math.PI*200)/100

  return <div className="Gaussian">
    <h1>Fitting the mutation distribution - demo using {tex`${`(1, 40)`}-ES`}</h1>
    <div>
      <label>Function: </label>
      <select value={fun} onChange={e => setFun(e.target.value)}>
        {Object.keys(functions).map(name => <option>{name}</option>)}        
      </select>
      {functions[fun].formula}
      <div className='row'>
        <div className='col'>
          <div className='row' style={{margin: 4}}>
            <Control min={0} max={2} step={0.01} label="" value={matrix[0]} setValue={setNth(0)}>
              {tex`${'\\sigma_1='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <Control min={0} max={2} step={0.01} label="" value={matrix[1]} setValue={setNth(1)}>
              {tex`${'\\sigma_2='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <Control min={0} max={twoPi} step={0.01} label="" value={matrix[2]} setValue={setNth(2)}>
              {tex`${'\\theta='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <button type='button' onClick={() => setPoints([[randn(), randn()]])}> Reset </button>
          </div>
        </div>
        <div style={{marginLeft: 10}}>
        {tex`${[`
          X_i \\sim \\mathcal{N}\\left(\\mu, 
            \\begin{bmatrix}
              \\cos(\\theta) & -\\sin(\\theta) \\\\
              \\sin(\\theta) &  \\cos(\\theta)
            \\end{bmatrix}
            \\begin{bmatrix}
              \\sigma_1^2 & 0 \\\\
              0 &  \\sigma_2^2
            \\end{bmatrix}
            \\begin{bmatrix}
              \\cos(\\theta) & -\\sin(\\theta) \\\\
              \\sin(\\theta) &  \\cos(\\theta)
            \\end{bmatrix}^{-1}
          \\right)
          `]}`}
        </div>
      </div>
    </div>
    <div className='svg'>
      <GaussianPlot funInfo={functions[fun]} sqrt={sqrt} points={points}/>
    </div>
  </div>
}

const GaussianPlot = ({sqrt, points, funInfo}: {
  sqrt: number[], points: [number, number][], funInfo: funType}) => {
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
  let thresholds: number[]
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
  
  const fcontours = useMemo(() => {
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

    return contours()
      .size([grid.n, grid.m])
      .thresholds(thresholds)(grid)
      .map(transform as any)
  }, [thresholds, grid])

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


  return (
    <svg ref={ref as any} width={960} height={720}>
      <g id='main' transform={`translate(${margin.left}, ${margin.top})`}>
        <rect id='bg' width={innerWidth} height={innerHeight} fill='rgb(0, 0, 127)'/>
        <g className='contour' />
        <g className='dots'>
          <circle id='center' cx={xScale(center[0])} cy={yScale(center[1])} r='3' fill='#0F0'/>
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

export default Gaussian

