# Global And Subject Profile Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete and verify the Vue frontend migration to the backend's global and per-subject student profile contract, including Onboarding state, the growth-profile workspace, and trusted Agent subject context.

**Architecture:** Keep transport contracts in `src/api/studentProfile.ts`, centralize schema-tolerant display conversion in `src/utils/studentProfileView.ts`, and let `src/views/Profile/index.vue` orchestrate independent global-profile and subject-profile states. Reuse the existing learning-space store as the trusted source for subject names and Agent `subjectId`.

**Tech Stack:** Vue 3, TypeScript, Pinia, Element Plus, Axios, Node test runner, Vue SFC compiler, Vite

---

## Working Tree Rules

- The frontend worktree already contains user changes in the files listed below. Inspect every diff before editing and preserve unrelated changes.
- Do not reset, checkout, or rewrite `src/utils/agentToolDisplay.ts`; its wording change is outside the profile migration.
- Use `npm.cmd` in PowerShell.
- Run all commands from `D:\develop\code\smartorder\smartorder-frontend`.

## File Structure

- `src/api/studentProfile.ts`: exact global/subject HTTP contract and TypeScript entities.
- `src/utils/studentProfileView.ts`: pure normalization and view-model conversion.
- `src/stores/user.ts`: derive `profileInitialized` from the real global profile.
- `src/views/Onboarding/index.vue`: submit the new global initialization request.
- `src/views/Profile/index.vue`: render global and subject profile states.
- `src/api/agent.ts`: declare optional trusted `subjectId`.
- `src/composables/useAgentChat.ts`: include positive `subjectId` in the SSE body.
- `src/views/AITutor/index.vue`: derive context options from active learning spaces.
- `tests/studentProfileContract.test.mjs`: endpoint and initialization contract.
- `tests/studentProfileView.test.mjs`: mapper behavior.
- `tests/profilePageStructure.test.mjs`: profile page structure and independent failure behavior.
- `tests/compileProfileSfc.mjs`: Vue SFC parse and compile check.
- `tests/agentSubjectContext.test.mjs`: trusted subject-context propagation.

### Task 1: Lock The Backend Profile Contract

**Files:**
- Modify: `src/api/studentProfile.ts`
- Modify: `src/stores/user.ts`
- Modify: `src/views/Onboarding/index.vue`
- Test: `tests/studentProfileContract.test.mjs`

- [ ] **Step 1: Extend the contract test before production edits**

Add assertions that the frontend exposes all six endpoints and preserves optimistic-lock fields:

```js
test('exposes all global and subject profile methods', () => {
  assert.match(apiSource, /getGlobalProfile\(\)/)
  assert.match(apiSource, /updateGlobalProfile\(data/)
  assert.match(apiSource, /initGlobalProfile\(params/)
  assert.match(apiSource, /listSubjectProfiles\(\)/)
  assert.match(apiSource, /getSubjectProfile\(subjectId/)
  assert.match(apiSource, /updateSubjectProfile\(subjectId/)
  assert.match(apiSource, /profileVersion\?: number/)
})
```

- [ ] **Step 2: Run the contract test and verify RED or existing coverage**

Run:

```powershell
node --test tests/studentProfileContract.test.mjs
```

Expected: the new assertion fails if any endpoint method or `profileVersion` field is missing. If it already passes because the user changes implemented the contract, record that as existing covered behavior and continue without rewriting it.

- [ ] **Step 3: Make the minimal contract corrections**

The API must expose these signatures:

```ts
getGlobalProfile(): Promise<StudentGlobalProfile | null>
updateGlobalProfile(data: StudentGlobalProfile): Promise<string>
initGlobalProfile(params: ProfileInitParams): Promise<string>
listSubjectProfiles(): Promise<StudentSubjectProfile[]>
getSubjectProfile(subjectId: number): Promise<StudentSubjectProfile | null>
updateSubjectProfile(subjectId: number, data: StudentSubjectProfile): Promise<string>
```

`fetchUserInfo()` must derive state only through:

```ts
const profile = await studentProfileApi.getGlobalProfile()
info.profileInitialized = isGlobalProfileInitialized(profile)
```

Onboarding completion and skip must call:

```ts
await studentProfileApi.initGlobalProfile(payload)
await userStore.fetchUserInfo()
```

- [ ] **Step 4: Run the contract test and verify GREEN**

Run:

```powershell
node --test tests/studentProfileContract.test.mjs
```

Expected: all contract tests pass.

### Task 2: Harden Schema-Tolerant View Mapping

**Files:**
- Modify: `src/utils/studentProfileView.ts`
- Test: `tests/studentProfileView.test.mjs`

- [ ] **Step 1: Add failing edge-case tests**

Add tests for unknown enum fallback, empty values, nested abilities, malformed dates, and zero behavior values:

```js
test('keeps unknown enum values readable', () => {
  assert.equal(labelFromMap('CUSTOM', {}), 'CUSTOM')
})

test('formats invalid dates without throwing', () => {
  assert.equal(formatProfileDate('not-a-date'), 'not-a-date')
})

test('keeps zero behavior metrics instead of treating them as empty', () => {
  const stats = buildBehaviorStats({
    activeDays: 0,
    sessionCount: 0,
    totalLearningMinutes: 0,
    taskCompletionRate: 0,
  })
  assert.deepEqual(stats.map(item => item.value), ['0', '0', '0 分钟', '0%'])
})
```

Export the tested helpers from the transpiled module.

- [ ] **Step 2: Run the mapper test and verify RED**

Run:

```powershell
node --test tests/studentProfileView.test.mjs
```

Expected: the zero-value test fails if truthiness checks produce “待记录”.

- [ ] **Step 3: Implement minimal mapper fixes**

Use explicit numeric checks:

```ts
const hasNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function buildBehaviorStats(raw: unknown) {
  const behavior = isRecord(raw) ? raw : {}
  return [
    { label: '活跃天数', value: displayNumber(behavior.activeDays, '待记录') },
    { label: '学习会话', value: displayNumber(behavior.sessionCount, '待记录') },
    {
      label: '累计时长',
      value: hasNumber(behavior.totalLearningMinutes)
        ? `${behavior.totalLearningMinutes} 分钟`
        : '待记录',
    },
    {
      label: '任务完成',
      value: hasNumber(behavior.taskCompletionRate)
        ? `${toPercent(behavior.taskCompletionRate)}%`
        : '待记录',
    },
  ]
}
```

Keep all labels in valid UTF-8 Chinese and leave unknown backend enums visible instead of dropping them.

- [ ] **Step 4: Run the mapper test and verify GREEN**

Run:

```powershell
node --test tests/studentProfileView.test.mjs
```

Expected: all mapper tests pass.

### Task 3: Complete The Growth Profile Workspace

**Files:**
- Modify: `src/views/Profile/index.vue`
- Modify: `tests/profilePageStructure.test.mjs`
- Verify: `tests/compileProfileSfc.mjs`

- [ ] **Step 1: Add a failing test for independent subject failure**

Add source assertions requiring separate state and separate load handling:

```js
test('keeps global profile usable when subject data fails', () => {
  assert.match(source, /subjectProfileError/)
  assert.match(source, /loadGlobalProfile/)
  assert.match(source, /loadSubjectProfiles/)
  assert.doesNotMatch(
    source,
    /Promise\.all\(\[\s*studentProfileApi\.getGlobalProfile\(\),\s*studentProfileApi\.listSubjectProfiles\(\)/,
  )
})
```

- [ ] **Step 2: Run the page test and verify RED**

Run:

```powershell
node --test tests/profilePageStructure.test.mjs
```

Expected: FAIL because the current page uses one `Promise.all` and one shared error.

- [ ] **Step 3: Split page loading into independent operations**

Add state:

```ts
const profileLoading = ref(false)
const profileError = ref('')
const subjectProfileLoading = ref(false)
const subjectProfileError = ref('')
```

Implement:

```ts
async function loadGlobalProfile() {
  profileLoading.value = true
  profileError.value = ''
  try {
    globalProfile.value = await studentProfileApi.getGlobalProfile()
  } catch (error: any) {
    profileError.value = error?.message || '全局画像暂时无法加载，请稍后重试。'
  } finally {
    profileLoading.value = false
  }
}

async function loadSubjectProfiles() {
  subjectProfileLoading.value = true
  subjectProfileError.value = ''
  try {
    const [subjects] = await Promise.all([
      studentProfileApi.listSubjectProfiles(),
      spaceStore.fetchSpaces('active'),
    ])
    subjectProfiles.value = subjects || []
  } catch (error: any) {
    subjectProfileError.value = error?.message || '单科画像暂时无法加载。'
  } finally {
    subjectProfileLoading.value = false
  }
}

async function loadProfile() {
  await Promise.all([loadGlobalProfile(), loadSubjectProfiles()])
}
```

Keep the selection watcher so an invalid selected subject falls back to the first available profile.

- [ ] **Step 4: Render loading, error, empty, and responsive subject states**

Inside the subject section, render:

```vue
<div v-if="subjectProfileLoading" class="subject-loading">正在整理单科画像...</div>
<section v-else-if="subjectProfileError" class="empty-panel compact error-panel">
  <div class="empty-mark">!</div>
  <h2>单科画像暂时不可用</h2>
  <p>{{ subjectProfileError }}</p>
  <el-button @click="loadSubjectProfiles">重新加载单科画像</el-button>
</section>
```

Preserve the confirmed visual direction:

- warm paper-like background;
- deep blue primary text;
- teal growth accents;
- amber risk accents;
- desktop multi-column workspace;
- mobile single-column layout;
- no fabricated profile data.

- [ ] **Step 5: Run page tests and SFC compilation**

Run:

```powershell
node --test tests/profilePageStructure.test.mjs
node tests/compileProfileSfc.mjs
```

Expected: both commands pass and print `Profile SFC compiled successfully`.

### Task 4: Verify Trusted Agent Subject Context

**Files:**
- Modify: `src/api/agent.ts`
- Modify: `src/composables/useAgentChat.ts`
- Modify: `src/views/AITutor/index.vue`
- Test: `tests/agentSubjectContext.test.mjs`

- [ ] **Step 1: Strengthen the subject-context test**

Require positive-ID filtering and global omission:

```js
test('sends only positive subject ids', () => {
  assert.match(composableSource, /subjectId && subjectId > 0 \? subjectId : undefined/)
  assert.match(viewSource, /activeContext\.value === 'global'/)
  assert.match(viewSource, /return undefined/)
})
```

- [ ] **Step 2: Run the subject-context test**

Run:

```powershell
node --test tests/agentSubjectContext.test.mjs
```

Expected: FAIL if the request can send mock string IDs, zero, or negative IDs. If already green, retain the current implementation.

- [ ] **Step 3: Apply only required corrections**

The SSE body must contain:

```ts
subjectId: subjectId && subjectId > 0 ? subjectId : undefined,
```

The AI Tutor must derive options from:

```ts
learningSpaceStore.activeSpaces.map(space => ({
  id: String(space.id),
  label: space.name,
  color: space.color || '#3b82f6',
}))
```

Route query synchronization must select only a positive numeric `spaceId`.

- [ ] **Step 4: Run the subject-context test and verify GREEN**

Run:

```powershell
node --test tests/agentSubjectContext.test.mjs
```

Expected: all Agent subject-context tests pass.

### Task 5: Full Frontend Regression

**Files:**
- Verify all touched frontend files

- [ ] **Step 1: Run all focused Node tests**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: every profile, Agent context, question stream, and existing frontend Node test passes.

- [ ] **Step 2: Compile the profile SFC**

Run:

```powershell
node tests/compileProfileSfc.mjs
```

Expected: `Profile SFC compiled successfully`.

- [ ] **Step 3: Run TypeScript checking**

Run:

```powershell
npm.cmd run type-check
```

Expected: no errors in modified files. If unrelated legacy errors remain, capture exact files and keep focused checks visible.

- [ ] **Step 4: Run the production build**

Run:

```powershell
npm.cmd run build
```

Expected: Vite build succeeds. If an unrelated existing dependency or legacy component blocks it, report the exact blocker separately.

- [ ] **Step 5: Check source encoding and diff hygiene**

Run:

```powershell
node -e "const fs=require('fs'); for (const f of ['src/utils/studentProfileView.ts','src/views/Profile/index.vue','src/views/Onboarding/index.vue','src/views/AITutor/index.vue']) { const s=fs.readFileSync(f,'utf8'); if (s.includes('\uFFFD')) throw new Error(f+' contains replacement characters') }"
git diff --check
git status --short
```

Expected:

- no Unicode replacement characters;
- no whitespace errors;
- `src/utils/agentToolDisplay.ts` remains untouched by this implementation;
- only intended profile/Agent files, tests, docs, and pre-existing user changes remain.
