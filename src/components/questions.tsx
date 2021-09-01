import { questionType } from "./questions/Question"
import MathJax from 'react-mathjax'

const { Provider, Node } = MathJax

const q = (question: string, answer: JSX.Element | string, nextQuestions?: questionType[]): questionType => ({
  question, answer, nextQuestions: nextQuestions || []
})

const tex = (strings: TemplateStringsArray, ...values: (string | [string])[]): JSX.Element => {
  return <Provider>{values.reduce((final, value, index) => [
    ...final, typeof value === 'string' ? <Node formula={value} inline/> : <Node formula={value[0]}/>, <span>{strings[index+1]}</span>], [<span>{strings[0]}</span>] as JSX.Element[])}
  </Provider>
}

const base_question =
q('What is this?', 'What you are seeing is an interactive introduction to Evolution Strategies', [
  q('What are Evolution Strategies?', 'Evolution Strategies is a class of algorithms inspired by nature\'s survival of the fittest', [
    q('What problems do they solve?', tex`They belong to a broader class of search algoritms meaning their goal
      is to find an optimal solution ${[`\\theta^\\ast = argmax_{\\theta \\in \\Theta}{F(\\theta)}`]}
      where ${`F`} is called the objective function or fitness`),
    q('How do they work?', `They work by maintaining a population of candidate solutions on which selection, crossover and mutation
      operators are applied`)
  ])
])

export default base_question