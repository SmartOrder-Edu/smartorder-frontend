import test from 'node:test'
import assert from 'node:assert/strict'
import { compareStreamIds, toEventOrderKey } from '../src/services/agentStreamProtocol.ts'

test('Redis Stream ID 按数值分量排序', () => {
  assert.equal(compareStreamIds('1-2', '1-10'), -1)
  assert.equal(compareStreamIds('10-0', '2-99'), 1)
  assert.ok(toEventOrderKey('1-2') < toEventOrderKey('1-10'))
  assert.throws(() => toEventOrderKey('1-123456789012345678901'))
})
