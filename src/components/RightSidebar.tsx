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

const ewma = (xs: number[], coef: number) => xs
  .reduce((ewmas, value) => [...ewmas, (coef*ewmas[ewmas.length-1]+(1-coef)*value)], [0])
  .slice(1).map((e, i) => e/(1-Math.pow(coef, i===0 ? 1 : i+1)))
export const reverse = <T extends unknown>(xs: T[]) => xs.slice().reverse()

const RewardChart = ({quantiles}: {quantiles: number[][]}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const n = quantiles[0].length

    const xScale = scaleLinear()
      .domain([0, Math.max(n-1, 0)])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([Math.min(...quantiles[4]), Math.max(...quantiles[0])])
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
    
    const areaGenerator = line()
      .x((d, i) => xScale(i < n ? i : 2*n-1-i))
      .y(d => yScale(d as any))
    
    for (let i=0; i<5; i++) {
      g.select(`#q${i}`)
        .attr('d', lineGenerator(quantiles[i] as any))
    }
    g.select('#area-all')
      .attr('d', areaGenerator([...quantiles[0], ...reverse(quantiles[4])] as any))
    g.select('#area-50')
      .attr('d', areaGenerator([...quantiles[1], ...reverse(quantiles[3])] as any))

  }, [quantiles[0].length])

  return (
    <svg ref={ref as any} width={320} height={180}>
      <g>
        <text className="title" textAnchor='middle' x='43%' y='-3%'>{"Reward"}</text>
        <g id="yAxisG" className="tick"></g>
        <g id="xAxisG" className="tick"></g>
        <path id="q0" className="line-path"/>
        <path id="q1" className="line-path-secondary"/>
        <path id="q2" className="line-path-secondary"/>
        <path id="q3" className="line-path-secondary"/>
        <path id="q4" className="line-path-secondary"/>
        <path id="area-all" className="area-20"/>
        <path id="area-50" className="area-40"/>
      </g>
    </svg>
  )
}

const SuccessChart = ({success, name}: {success: number[], name: string}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    
    const coef = 0.9
    const success_ewma = ewma(success, coef)

    const xScale = scaleLinear()
      .domain([0, Math.max(success.length-1, 0)])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([0, Math.max(...success)])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const yAxis = axisRight(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickFormat(x => (x as any).toFixed(2))
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
    
    g.select('#success')
      .attr('d', lineGenerator(success as any))
    
    g.select('#success-ewma')
      .attr('d', lineGenerator(success_ewma as any))

  }, [success.length])

  return (
    <svg ref={ref as any} width={320} height={180}>
      <g>
        <text className="title" textAnchor='middle' x='43%' y='-3%'>{`${name} success rate`}</text>
        <g id="yAxisG" className="tick"></g>
        <g id="xAxisG" className="tick"></g>
        <path id="success" className="line-path-secondary"/>
        <path id="success-ewma" className="line-path"/>
      </g>
    </svg>
  )
}

const AgeChart = ({gensSinceCreated, gensSinceMutated, ageSinceMutation, setAgeSinceMutation}: {
  gensSinceCreated: number[][], gensSinceMutated: number[][], ageSinceMutation: boolean,
  setAgeSinceMutation: (f: (b: boolean) => boolean) => void}) => {
  const ref = useD3((svg: any) => {
    const width = +svg.attr('width')
    const height = +svg.attr('height')
    
    const margin = { top: 20, right: 40, bottom: 20, left: 10 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    const gens = ageSinceMutation ? gensSinceMutated : gensSinceCreated
    const n = gens[0].length

    const xScale = scaleLinear()
      .domain([0, Math.max(n-1, 0)])
      .range([0, innerWidth])
    
    const yScale = scaleLinear()
      .domain([0, Math.max(...gens[0])])
      .range([innerHeight, 0])
      .nice()
    
    const g = svg.select('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    const yAxis = axisRight(yScale)
      .ticks(6)
      .tickSize(-innerWidth)
      .tickFormat(x => (x as any).toFixed(0))
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
    
    const areaGenerator = line()
      .x((d, i) => xScale(i < n ? i : 2*n-1-i))
      .y(d => yScale(d as any))
    
    for (let i=0; i<1; i++) {
      g.select(`#creation-q${i}`)
        .attr('d', lineGenerator(gens[i] as any))
    }

    g.select('#creation-q0-ewma')
      .attr('d', lineGenerator(ewma(gens[0], 0.9) as any))

    g.select('#creation-area-all')
      .attr('d', areaGenerator([...gens[0], ...reverse(gens[4])] as any))
    g.select('#creation-area-50')
      .attr('d', areaGenerator([...gens[1], ...reverse(gens[3])] as any))

  }, [gensSinceCreated[0].length, ageSinceMutation])

  return (
    <div>
      <svg ref={ref as any} width={320} height={180} onClick={() => setAgeSinceMutation(b => !b)}>
        <g>
          <text className="title" textAnchor='middle' x='43%' y='-3%'>
            Age of agents since {ageSinceMutation ? " last mutation" : "creation"}
          </text>
          <g id="yAxisG" className="tick"></g>
          <g id="xAxisG" className="tick"></g>
          <path id="creation-q0" className="line-path"/>
          <path id="creation-q1" className="line-path-secondary"/>
          <path id="creation-q2" className="line-path-secondary"/>
          <path id="creation-q3" className="line-path-secondary"/>
          <path id="creation-q4" className="line-path-secondary"/>
          <path id="creation-area-all" className="area-20"/>
          <path id="creation-area-50" className="area-40"/>
        </g>
      </svg>
    </div>
  )
}

export default function RightSidebar({
  quantiles, mutationSuccess, crossoverSuccess, gensSinceCreated, gensSinceMutated,
  ageSinceMutation, setAgeSinceMutation
}: {
  quantiles: number[][], mutationSuccess: number[], crossoverSuccess: number[],
  gensSinceCreated: number[][], gensSinceMutated: number[][], ageSinceMutation: boolean,
  setAgeSinceMutation: (f: (b: boolean) => boolean) => void
}) {
  return (
    <div className='right-sidebar'>
      <RewardChart quantiles={quantiles}/>
      <SuccessChart success={mutationSuccess} name="Mutation"/>
      <SuccessChart success={crossoverSuccess} name="Crossover"/>
      <AgeChart
        gensSinceCreated={gensSinceCreated} gensSinceMutated={gensSinceMutated}
        ageSinceMutation={ageSinceMutation} setAgeSinceMutation={setAgeSinceMutation}
      />
    </div>
  )
}
