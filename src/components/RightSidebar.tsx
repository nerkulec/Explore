import React, {useRef} from 'react'
import {
  select,
  scaleLinear,
  axisRight,
  axisBottom,
  line
} from 'd3'
import './RightSidebar.css'

export const useD3 = (
  render: any,
  dependencies: React.DependencyList | undefined) => {
  const ref = useRef()

  React.useEffect(() => {
    render(select(ref.current as any))
    return () => {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
  return ref
}

const RewardChart = ({rewards}: {rewards: number[][]}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const yValue = (d: number[]) => Math.max(...d)
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const xScale = scaleLinear()
      .domain([0, rewards.length-1])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([Math.min(...rewards.map((d: number[]) => Math.max(...d))), Math.max(...rewards.flat())])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const yAxis = axisRight(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickPadding(5)
    
    const yAxisG = g.select('#yAxisG')
      .call(yAxis)
      .attr('transform', `translate(${innerWidth}, 0)`)
    yAxisG.selectAll('.domain').remove()

    const xAxis = axisBottom(xScale)
      .ticks(6)
      .tickSize(-innerHeight)
    
    const xAxisG = g.select('#xAxisG')
      .call(xAxis)
      .attr('transform', `translate(0, ${innerHeight})`)
    xAxisG.selectAll('.domain').remove()
    
    const lineGenerator = line()
      .x((d, i) => xScale(i))
      .y(d => yScale(yValue(d)))
    
    g.select('path')
      .attr('d', lineGenerator(rewards as any))

  }, [rewards.length])

  return (
    <svg ref={ref as any} width={320} height={180}>
      <g>
        <text className="title" textAnchor='middle' x='45%' y='-3%'>{"Reward"}</text>
        <g id="yAxisG" className="tick"></g>
        <g id="xAxisG" className="tick"></g>
        <path id="path" className="line-path"/>
      </g>
    </svg>
  )
}

const CorrChart = ({correlations}: {correlations: number[]}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const correlation_ewma = correlations.reduce((ewmas: number[], v: number) => {
      const ewma = 0.9*ewmas[ewmas.length-1]+0.1*v
      return [...ewmas, ewma]
    }, [0]).slice(1)

    const xScale = scaleLinear()
      .domain([0, correlations.length-1])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([Math.min(...correlations, ...correlation_ewma), Math.max(...correlations, ...correlation_ewma)])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const yAxis = axisRight(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickPadding(5)
    
    const yAxisG = g.select('#yAxisG')
      .call(yAxis)
      .attr('transform', `translate(${innerWidth}, 0)`)
    yAxisG.selectAll('.domain').remove()

    const xAxis = axisBottom(xScale)
      .ticks(6)
      .tickSize(-innerHeight)
    
    const xAxisG = g.select('#xAxisG')
      .call(xAxis)
      .attr('transform', `translate(0, ${innerHeight})`)
    xAxisG.selectAll('.domain').remove()
    
    const lineGenerator = line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d as any))
    
    g.select('#correlation_ewma')
      .attr('d', lineGenerator(correlation_ewma as any))
  
    g.select('#correlation')
      .attr('d', lineGenerator(correlations as any))

  }, [correlations.length])

  return (
    <svg ref={ref as any} width={320} height={180}>
      <g>
        <text className="title" textAnchor='middle' x='45%' y='-3%'>{"Correlation"}</text>
        <g id="yAxisG" className="tick"></g>
        <g id="xAxisG" className="tick"></g>
        <path id="correlation_ewma" className="line-path"/>
        <path id="correlation" className="line-path-secondary"/>
      </g>
    </svg>
  )
}

export default function RightSidebar({rewards, correlations}: {rewards: number[][], correlations: number[]}) {
  return (
    <div>
      <RewardChart rewards={rewards}/>
      <CorrChart correlations={correlations}/>
    </div>
  )
}
