import React, { useMemo } from "react"
import { useState } from "react"
import Control from "../control/Control"
import { useD3 } from "../RightSidebar"
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

type funType = {
  value: (x: number, y: number) => number
  optimum: [number, number]
  scale: 'log' | 'lin'
  thresholdRange: [number, number]
  xDomain: number
}

const functions: {
  [key: string]: funType
} = {
  Rosenbrock: {
    value: (x, y) => (1-x)**2+100*(y-x**2)**2,
    optimum: [1, 1],
    scale: 'log',
    thresholdRange: [-1, 20],
    xDomain: 8
  }
}


type Props = {
  
}

const Gaussian: React.FC<Props> = () => {
  const [fun, setFun] = useState('Rosenbrock')
  const [matrix, setMatrix] = useState(() => [1, 0, 1])
  const [points, setPoints] = useState<[number, number][]>([[0, 0]])
  const sqrt = useMemo(() => {



    const s = Math.sqrt(matrix[0]*matrix[2]-matrix[1]*matrix[1])
    const t = Math.sqrt(matrix[0]+matrix[2]+2*s)
    const sqrt = [matrix[0]+s, matrix[1], matrix[1], matrix[2]+s].map(x => x/t)
    return sqrt
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
        for (let i=0; i<100; i++) {
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

  const maxCorr = Math.floor(Math.sqrt(matrix[0]*matrix[2])*100)/100

  return <div className="Gaussian">
    <h2>Fitting the mutation distribution demo</h2>
    <div>
      <label>Function: </label>
      <select value={fun} onChange={e => setFun(e.target.value)}>
        <option>Rosenbrock</option>
        <option>Grid with many local optima</option>
        <option>Mountain car</option>
      </select>
      <Control min={0.05} max={3} step={0.01} label="" value={matrix[0]} setValue={setNth(0)}/>
      <Control min={-maxCorr} max={maxCorr} step={0.01} label="" value={matrix[1]} setValue={setNth(1)}/>
      <Control min={0.05} max={3} step={0.01} label="" value={matrix[2]} setValue={setNth(2)}/>
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

  const { value, optimum: [xOpt, yOpt], scale, xDomain, thresholdRange } = funInfo

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
    thresholds = range(...thresholdRange).map(i => Math.pow(2, i))
    scaleSeq = scaleSequentialLog
  } else {
    thresholds = range(...thresholdRange)
    scaleSeq = scaleSequential
  }
  const color = scaleSeq(extent(thresholds) as any, interpolatePlasma)
  const grid = useMemo(() => {
    const q = 4
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

    svg.select('#center')
      .attr('cx', xScale(center[0]))
      .attr('cy', yScale(center[1]))
      .attr('r', 3)
      .attr('fill', '#00FF00')

    svg.select('#optimum')
      .attr('cx', xScale(xOpt))
      .attr('cy', yScale(yOpt))
      .attr('r', 3)
      .attr('fill', '#FF0000')

  }, [sqrt, points])

  return (
    <svg ref={ref as any} width={960} height={720}>
      <g id='main' transform={`translate(${margin.left}, ${margin.top})`}>
        <rect id='bg' width={innerWidth} height={innerHeight} fill='#000'/>
        <g className='contour' />
        <g className='dots'>
          <circle id='center'/>
          <circle id='optimum'/>
        </g>
        <g id='elipses'>
          <path id='area-0' className='ellipse area-0'/>
          <path id='area-1' className='ellipse area-1'/>
          <path id='area-2' className='ellipse area-2'/>
          <path id='area-3' className='ellipse area-3'/>
          <path id='area-4' className='ellipse area-4'/>
          {
            circles.map(({x, y, fill, r}) => <circle cx={x} cy={y} r={r} fill={fill}/>)
          }
        </g>
      </g>
    </svg>
  )
}

export default Gaussian

