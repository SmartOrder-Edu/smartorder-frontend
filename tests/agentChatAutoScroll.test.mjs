import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const moduleUrl = new URL('../src/composables/useAgentChat.ts', import.meta.url)
const source = await readFile(moduleUrl, 'utf8')
const viewUrl = new URL('../src/views/AITutor/index.vue', import.meta.url)
const viewSource = await readFile(viewUrl, 'utf8')

test('scrolls after the user message and loading indicator are rendered', () => {
  const sendMessageStart = source.indexOf('const sendMessage = async')
  const confirmPlanStart = source.indexOf('const confirmPlan = async', sendMessageStart)

  assert.notEqual(sendMessageStart, -1, 'sendMessage implementation should exist')
  assert.notEqual(confirmPlanStart, -1, 'confirmPlan should delimit sendMessage')

  const sendMessageSource = source.slice(sendMessageStart, confirmPlanStart)
  const appendIndex = sendMessageSource.indexOf('messages.value.push({')
  const startTurnIndex = sendMessageSource.indexOf('agentStore.startNewTurn()', appendIndex)
  const scrollIndex = sendMessageSource.indexOf('scrollCallback?.()', appendIndex)

  assert.notEqual(appendIndex, -1, 'sendMessage should append the user message')
  assert.notEqual(startTurnIndex, -1, 'sendMessage should start an agent turn')
  assert.ok(
    scrollIndex > startTurnIndex,
    'the chat should scroll after the loading indicator is scheduled for rendering',
  )
})

test('binds the scroll ref to the element that owns vertical overflow', () => {
  assert.match(
    viewSource,
    /<div class="chat-flow" ref="chatContainer">/,
    'chatContainer must reference the scrollable chat-flow element',
  )
  assert.doesNotMatch(
    viewSource,
    /<div class="chat-messages" ref="chatContainer"/,
    'chatContainer must not reference the non-scrollable message list',
  )
})
