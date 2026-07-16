import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const previewUrl = new URL('../src/views/CloudDrive/preview.vue', import.meta.url)
const source = await readFile(previewUrl, 'utf8')
const detailUrl = new URL('../src/views/ResourceSquareDetail/index.vue', import.meta.url)
const detailSource = await readFile(detailUrl, 'utf8')

test('accepts a resource-square id when initializing preview', () => {
  assert.match(
    source,
    /if \(!fileId\.value && !squareId\.value\) \{/,
    'preview initialization must accept squareId when no cloud-drive id is present',
  )
})

test('passes the resource file type to both preview entry points', () => {
  const fileTypeParameter = '&type=${encodeURIComponent(detail.value.fileType || \'\')}'
  const occurrences = detailSource.split(fileTypeParameter).length - 1

  assert.equal(
    occurrences,
    2,
    'iframe and new-window previews must both receive the resource file type',
  )
})

test('prefers the explicit file type over the resource title suffix', () => {
  assert.match(
    source,
    /const fileType = String\(route\.query\.type \|\| ''\)/,
    'preview should read the explicit type parameter',
  )
  assert.match(
    source,
    /const fileExt = ref\(fileType \|\| fileName\.value\.split\('\.'\)\.pop\(\)\?\.toLowerCase\(\) \|\| ''\)/,
    'preview should use the explicit type before falling back to the title suffix',
  )
})
