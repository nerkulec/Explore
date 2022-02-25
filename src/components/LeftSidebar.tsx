import React, {useRef} from 'react'
import {
  scaleLinear,
  axisRight,
  axisBottom,
  line
} from 'd3'
import './Sidebar.css'
import {useD3} from './RightSidebar'

const ewma = (xs: number[], coef: number) => xs
  .reduce((ewmas, value) => [...ewmas, (coef*ewmas[ewmas.length-1]+(1-coef)*value)], [0])
  .slice(1).map((e, i) => e/(1-Math.pow(coef, i===0 ? 1 : i+1)))
export const reverse = <T extends unknown>(xs: T[]) => xs.slice().reverse()

const SigmasChart = ({sigmas, start, end, title}: {sigmas: number[][][], start: number, end: number, title: string}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const n = sigmas.length

    const xScale = scaleLinear()
      .domain([0, Math.max(n-1, 0)])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([
        Math.min(...sigmas.map(s => Math.min(...s.slice(start, end).map(e => e[4])))),
        Math.max(...sigmas.map(s => Math.max(...s.slice(start, end).map(e => e[0]))))
      ])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const yAxis = axisRight(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickFormat(x => (x as any).toFixed(1))
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
    
    // const areaGenerator = line()
    //   .x((d, i) => xScale(i < n ? i : 2*n-1-i))
    //   .y(d => yScale(d as any))
    for (let j=start; j<end; j++) {
      for (const i of [0, 2, 4]) {
        g.select(`#q${i}s${j}`)
          .attr('d', lineGenerator(sigmas.map(s => s[j][i]) as any))
      }
    }
    // g.select('#area-all')
    //   .attr('d', areaGenerator([...quantiles[0], ...reverse(quantiles[4])] as any))
    // g.select('#area-50')
    //   .attr('d', areaGenerator([...quantiles[1], ...reverse(quantiles[3])] as any))

  // eslint-disable-next-line
  }, [sigmas.length])
  const paths = []
  for (let j=start; j<end; j++) {
    paths.push(j)
  }
  return (
    <svg ref={ref as any} width={320} height={180}>
      <g>
        <text className="title" textAnchor='middle' x='43%' y='-3%'>{title}</text>
        <g id="yAxisG" className="tick"></g>
        <g id="xAxisG" className="tick"></g>
        {
        paths.map(p => <g key={p}>
          <path id={"q0s"+p} className="line-path-r"/>
          {/* <path id={"q1s"+p} className="line-path-secondary"/> */}
          <path id={"q2s"+p} className="line-path"/>
          {/* <path id={"q3s"+p} className="line-path-secondary"/> */}
          <path id={"q4s"+p} className="line-path-g"/>
          <path id={"area-alls"+p} className="area-20"/>
          <path id={"area-50s"+p} className="area-40"/>
        </g>)
        }
      </g>
    </svg>
  )
}

export default function LeftSidebar({
  sigmas
}: {
  sigmas: number[][][]
}) {
  return (
    <div className='sidebar'>
      <SigmasChart sigmas={sigmas} start={0} end={2} title={"Log sigma (NNs)"}/>
      <SigmasChart sigmas={sigmas} start={3} end={9} title={"Log sigma (structure)"}/>
      <SigmasChart sigmas={sigmas} start={9} end={9+16} title={"Log sigma (lengths)"}/>
      <SigmasChart sigmas={sigmas} start={9+16} end={9+32} title={"Log sigma (angles)"}/>
    </div>
  )
}
