import React, { useMemo } from "react"
import { useState } from "react"
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
import { useEffect } from "react"
import { functions } from './Gaussian'
import { argsort, randn } from "../../evo/Evolution"
import Control from "../control/Control"
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

const Cmaes: React.FC<Props> = () => {
  const [fun, setFun] = useState('Rosenbrock')
  const [mu, setMu] = useState(10)
  const [discount, setDiscount] = useState(-1)
  const [points, setPoints] = useState<[number, number, number, [number, number][]]>([1, 1, 0, [[randn(), randn()]]])

  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(([sigmaX, sigmaY, sigmaXY, points]: [number, number, number, [number, number][]]) => {
        const {value} = functions[fun]
        if (points.length <= 1) {
          for (let i=0; i<40; i++) {
            points.push([sigmaX*randn(), sigmaY*randn()])
          }
        }
        const [[cx, cy]] = points
        const values = points.map(([x, y]) => value(x, y))
        const rank = argsort(values)
        const n = mu
        const best = rank.slice(0, n).map(i => points[i])
        const newSigmaX = best.reduce((sx, [x, y]) => sx+(x-cx)**2, 0)/n
        const newSigmaY = best.reduce((sy, [x, y]) => sy+(y-cy)**2, 0)/n
        const newSigmaXY = best.reduce((sxy, [x, y]) => sxy+(x-cx)*(y-cy), 0)/n
        const newCX = best.reduce((s, [x, y]) => s+x, 0)/n
        const newCY = best.reduce((s, [x, y]) => s+y, 0)/n
        const alpha = Math.pow(10, discount)
        const wsx = (1-alpha)*sigmaX+alpha*newSigmaX
        const wsy = (1-alpha)*sigmaY+alpha*newSigmaY
        const wsxy = (1-alpha)*sigmaXY+alpha*newSigmaXY
        // const wsx = sigmaX
        // const wsy = sigmaY
        // const wsxy = sigmaXY
        const newSigmaXsqrt = Math.sqrt(wsx)
        const newSigmaYsqrt = Math.sqrt(wsy)
        const s = Math.sqrt(newSigmaXsqrt*newSigmaYsqrt-wsxy)
        const t = Math.sqrt(newSigmaXsqrt+newSigmaYsqrt+2*s)
        const m11 = (wsx+s)/t
        const m22 = (wsy+s)/t
        const m12 = wsxy/t
        const newPoints: [number, number][] = [[newCX, newCY]]
        for (let i=0; i<40; i++) {
          const dx = randn()
          const dy = randn()
          newPoints.push([
            newCX+m11*dx+m12*dy,
            newCY+m12*dx+m22*dy
          ])
        }
        
        return [wsx, wsy, wsxy, newPoints] as [number, number, number, [number, number][]]
      })
    }, 200)
    return () => clearInterval(interval)
  }, [points, setPoints, fun, mu, discount])

  const [,,, points_] = points

  return <div className="Gaussian">
    <h1>Self-adaptation of covariance matrix demo using {tex`${`(\\mu, 40)`}`}-CMA-ES (simplified)</h1>
    <div>
      <label>Function: </label>
      <select value={fun} onChange={e => setFun(e.target.value)}>
        {Object.keys(functions).map(name => <option>{name}</option>)}        
      </select>
      {functions[fun].formula}
      <div className='row'>
        <div className='col'>
          <div className='row' style={{margin: 4}}>
            <Control min={1} max={20} step={1} label="" value={mu} setValue={setMu}>
              {tex`${'\\mu='}`}
            </Control>
          </div>
          <div className='row' style={{margin: 4}}>
            <Control min={-2} max={0} step={0.1} label="" value={discount} setValue={setDiscount}>
              {tex`${'\\log_{10}(\\alpha)='}`}
            </Control>
          </div>
          <button type='button' onClick={() => setPoints([1, 1, 0, [[randn(), randn()]]])}> Reset </button>
        </div>
        <div style={{marginLeft: 10}}>
        </div>
      </div>
    </div>
    <div className='row'>
      <div className='svg'>
        <Plot funInfo={functions[fun]} points={points_}/>
      </div>
        <h2>{tex`${[`
          X_i \\sim \\mathcal{N}\\left(\\mu_X, C\\right)\\\\
          X_{1-\\mu:\\lambda} = X_{1:\\lambda}, ..., X_{\\mu:\\lambda}\\\\
          \\hat{C} = \\frac1\\mu (X_{1-\\mu:\\lambda}-\\mu_X)(X_{1-\\mu:\\lambda}-\\mu_X)^T\\\\
          C' = (1-\\alpha)C + \\alpha \\hat{C}\\\\
          \\mu_X' = \\overline{X_{1-\\mu:\\lambda}}
          `]}`}
        </h2>
    </div>
  </div>
}

const Plot = ({points, funInfo}: {
  points: [number, number][], funInfo: funType}) => {
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

export default Cmaes

