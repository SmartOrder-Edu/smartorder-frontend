import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routerUrl = new URL('../src/router/index.ts', import.meta.url)
const layoutUrl = new URL('../src/components/layout/AdminLayout.vue', import.meta.url)
const apiUrl = new URL('../src/api/adminUser.ts', import.meta.url)

test('admin user management is wired into route, menu, and backend api', async () => {
  const [routerSource, layoutSource, apiSource] = await Promise.all([
    readFile(routerUrl, 'utf8'),
    readFile(layoutUrl, 'utf8'),
    readFile(apiUrl, 'utf8'),
  ])

  assert.match(routerSource, /path:\s*['"]users['"]/)
  assert.match(routerSource, /AdminUserManagement/)
  assert.match(layoutSource, /\/admin\/users/)
  assert.match(apiSource, /\/admin\/users\/page/)
  assert.match(apiSource, /\/admin\/users\/stats/)
  assert.match(apiSource, /\/admin\/users\/\$\{id\}\/role\/\$\{role\}/)
  assert.match(apiSource, /\/admin\/users\/\$\{id\}\/status\/\$\{status\}/)
})
