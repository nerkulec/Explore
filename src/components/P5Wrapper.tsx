import p5 from "p5"
import deepEqual from "deep-equal"
import React, { FC, memo, useEffect, useState } from "react"
import { useCallback } from "react"

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
  const [instance, setInstance] = useState<P5Instance>()

  useEffect(() => {
    instance?.updateWithProps?.(props)
  }, [props, instance])

  const wrapper = useCallback(node => {
    if (node.current === null) return
    const canvas = createCanvas(sketch, node.current)
    setInstance(canvas)
  }, [sketch])

  return <div ref={wrapper}>{children}</div>
}

export const P5Wrapper = memo(
  P5WrapperComponent,
  (previousProps: P5WrapperProps, nextProps: P5WrapperProps) => {
    return deepEqual(previousProps, nextProps, { strict: true })
  }
)