import React from "react"
import { useState } from "react"

import "./Question.css"

export type questionType = {
  question: string
  answer: JSX.Element | string
  nextQuestions: questionType[]
}

type Props = {
  question: questionType
}

const Question: React.FC<Props> = ({
  question: q
}) => {
  const [shown, setShown] = useState(false)
  const {question, answer, nextQuestions} = q
  return (
  <div className='Question'>
    <h1 onClick={() => setShown(true)}>{question}</h1>
    {shown ? <div className='answer'>
      {answer}
      {nextQuestions.map((q, i) => <Question question={q} key={i}/>)}
    </div> : null}
  </div>
)}

export default Question

