import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const requestUrl = new URL('../src/api/request.ts', import.meta.url)
const source = await readFile(requestUrl, 'utf8')

test('admin requests use backend data instead of local mock data', () => {
  assert.doesNotMatch(
    source,
    /import\s+\{\s*handleAdminMock\s*\}\s+from\s+['"]@\/mocks\/adminMock['"]/,
    'request.ts must not import the local admin mock handler when backend admin APIs are available',
  )
  assert.doesNotMatch(
    source,
    /ENABLE_ADMIN_MOCK\s*=\s*true/,
    'admin mock switch must be off so /admin/** requests reach the backend',
  )
  assert.doesNotMatch(
    source,
    /handleAdminMock\(config\)/,
    'request.ts must not short-circuit /admin/** requests with local mock data',
  )
})
