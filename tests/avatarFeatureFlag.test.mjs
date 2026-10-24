import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const tutorUrl = new URL('../src/views/AITutor/index.vue', import.meta.url)
const apiUrl = new URL('../src/api/avatar.ts', import.meta.url)

test('数字人仅在系统配置开启后显示并预取鉴权', async () => {
  const [tutor, api] = await Promise.all([
    readFile(tutorUrl, 'utf8'),
    readFile(apiUrl, 'utf8'),
  ])

  assert.match(api, /\/teacher\/avatar\/config/)
  assert.match(tutor, /v-if="avatarEnabled && isAssistantCollapsed"/)
  assert.match(tutor, /v-if="avatarEnabled && !isAssistantCollapsed"/)
  assert.match(tutor, /defineAsyncComponent\(\(\) => import\('@\/components\/AssistantPanel\.vue'\)\)/)
  assert.match(tutor, /avatarEnabled\.value = config\?\.enabled === true/)
  assert.match(tutor, /if \(!avatarEnabled\.value\) return/)
  assert.match(tutor, /if \(avatarEnabled\.value && !collapsed/)
})
