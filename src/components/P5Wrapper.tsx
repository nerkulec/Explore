import p5 from "p5"
import deepEqual from "deep-equal"
import React, { createRef, FC, memo, useEffect, useState } from "react"

export interface SketchProps {
  [key: string]: any
}

export interface Sketch {
  (instance: p5): void
}

export interface P5WrapperProps extends SketchProps {
  sketch: Sketch
}

export interface P5Instance extends p5 {
  updateWithProps?: (props: SketchProps) => void
}

function createCanvas(sketch: Sketch, container: HTMLDivElement) {
  return new p5(sketch, container) as P5Instance
}

const P5WrapperComponent: FC<P5WrapperProps> = ({
  sketch,
  children,
  ...props
}) => {
  const wrapper = createRef<HTMLDivElement>()
  const [instance, setInstance] = useState<P5Instance>()

  useEffect(() => {
    if (wrapper.current === null) return
    instance?.remove()
    const canvas = createCanvas(sketch, wrapper.current)
    setInstance(canvas)
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    instance?.updateWithProps?.(props)
  })

  return <div ref={wrapper}>{children}</div>
}

export const P5Wrapper = memo(
  P5WrapperComponent,
  (previousProps: P5WrapperProps, nextProps: P5WrapperProps) => {
    return deepEqual(previousProps, nextProps, { strict: true })
  }
)