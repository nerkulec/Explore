import React from "react"
import { useState } from "react"

import "./Shower.css"

type Props = {
  question: string
}

const Control: React.FC<Props> = ({
  question,
  children
}) => {
  const [shown, setShown] = useState(false)
  return (
    <div className='Shower'>
      <h1 onClick={() => setShown(true)}>{question}</h1>
      {shown ? children : null}
    </div>
  )
}

export default Control
