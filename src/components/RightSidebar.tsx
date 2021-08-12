import React, {useRef} from 'react'
import {
  select,
  scaleLinear,
  axisLeft,
  axisBottom,
  line,
  curveBasis
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

const LineChart = ({data, title}: {data: number[][], title: string}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const xAxisLabel = 'Epoch'
    
    const yValue = (d: number[]) => Math.max(...d)
    const yAxisLabel = 'Reward'
    
    const margin = { top: 30, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const xScale = scaleLinear()
      .domain([0, data.length-1])
      .range([0, innerWidth])
      .nice()
    
    const yScale = scaleLinear()
      .domain([Math.min(...data.map((d: number[]) => Math.max(...d))), Math.max(...data.flat())])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const xAxis = axisBottom(xScale)
      .tickSize(-innerHeight)
      .tickPadding(15)
    
    const yAxis = axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickPadding(10)

    g.select('.title')
      .attr('y', -15)
    
    const yAxisG = g.select('#yAxisG').call(yAxis)
    // yAxisG.selectAll('.domain').remove()
    
    yAxisG.select('#yLabel')
      .attr('y', 0)
      .attr('x', -innerHeight / 2)
      .attr('fill', 'black')
      .attr('transform', `rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text(yAxisLabel)
    
    const xAxisG = g.select('#xAgisG').call(xAxis)
      .attr('transform', `translate(0,${innerHeight})`)
    
    // xAxisG.select('.domain').remove()
    
    xAxisG.select('#xLabel')
      .attr('y', innerHeight)
      .attr('x', innerWidth / 2)
      .attr('fill', 'black')
      .text(xAxisLabel)
    
    const lineGenerator = line()
      .x((d, i) => xScale(i))
      .y(d => yScale(yValue(d)))
    
    g.select('#path')
      .attr('d', lineGenerator(data as any))

  }, [data.length])

  return (
    <svg ref={ref as any} width={180} height={120}>
      <g>
        <text className="title">{title}</text>
        <g id="yAxisG" className="tick">
          <text id="yLabel" className="axis-label"/>
        </g>
        <g id="xAxisG" className="tick">
          <text id="xLabel" className="axis-label"/>
        </g>
        <path id="path" className="line-path"/>
      </g>
    </svg>
  )
}

export default function RightSidebar({rewards}: {rewards: number[][]}) {
  return (
    <div>
      <LineChart data={rewards} title={"Max reward"}/>
    </div>
  )
}
