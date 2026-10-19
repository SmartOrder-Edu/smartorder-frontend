import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/components/exam/CodeEditor.vue', import.meta.url), 'utf8')

test('CodeEditor renders syntax highlight layer for code colors', () => {
  assert.match(source, /code-highlight-layer/)
  assert.match(source, /highlightedCode/)
  assert.match(source, /hljs\.highlight/)
  assert.match(source, /:deep\(\.hljs-keyword\)/)
})
