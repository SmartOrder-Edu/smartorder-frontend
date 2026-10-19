import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import ts from 'typescript'

const moduleUrl = new URL('../src/mocks/algorithmQuestionMock.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2020
  }
})
const mockModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)

const { getMockAlgorithmDefaultAnswers, getMockAlgorithmQuestions } = mockModule

test('provides the linked-list insertion sort algorithm mock question', () => {
  const [question] = getMockAlgorithmQuestions()

  assert.equal(question.questionType, 'code')
  assert.equal(question.questionTypeName, '编程题')
  assert.equal(question.correctAnswer.allowedLanguages[0], 'c11')
  assert.match(question.stem, /单链表/)
  assert.match(question.stem, /插入排序/)
  assert.deepEqual(question.correctAnswer.examples[0], {
    input: '5\n3 1 4 2 5',
    output: '1 2 3 4 5'
  })
  assert.deepEqual(question.correctAnswer.examples[1], {
    input: '3\n10 5 8',
    output: '5 8 10'
  })
})

test('provides a filled demo answer for recording', () => {
  const [question] = getMockAlgorithmQuestions()
  const answers = getMockAlgorithmDefaultAnswers()
  const demoAnswer = answers[question.id]

  assert.match(demoAnswer, /Node dummy;/)
  assert.match(demoAnswer, /prev->next = cur;/)
  assert.match(demoAnswer, /free\(temp\);/)
})
