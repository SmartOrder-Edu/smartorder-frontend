<template>
  <div class="docmee-ppt-viewer">
    <div v-if="!pptId" class="ppt-empty">
      <h3>暂无可预览的 PPT</h3>
      <p>当前资源还没有 Docmee PPT ID。</p>
      <el-button v-if="fileUrl" type="primary" plain @click="openFile">打开 PPT 文件</el-button>
    </div>

    <div v-else class="ppt-frame-wrap">
      <div v-if="loading" class="ppt-loading">
        <el-skeleton :rows="8" animated />
      </div>
      <div v-if="error" class="ppt-error">
        <h3>PPT 渲染失败</h3>
        <p>{{ error }}</p>
        <div class="ppt-error-actions">
          <el-button type="primary" plain @click="reload">重新加载</el-button>
          <el-button v-if="fileUrl" @click="openFile">打开 PPT 文件</el-button>
        </div>
      </div>
      <div ref="containerRef" class="ppt-frame" :class="{ hidden: loading || error }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DocmeeUI } from '@docmee/sdk-ui'
import { pptApi } from '@/api/ppt'

const props = defineProps<{
  resourceId: string
  pptId?: string
  fileUrl?: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const loading = ref(false)
const error = ref('')
let docmeeUI: any = null

async function initViewer() {
  destroyViewer()
  error.value = ''
  if (!props.pptId) return

  loading.value = true
  try {
    const token = await pptApi.getRenderToken(props.resourceId, props.pptId)
    await nextTick()
    if (!containerRef.value) return

    docmeeUI = new DocmeeUI({
      token: token.token,
      container: containerRef.value,
      page: 'editor',
      creatorVersion: 'v2',
      pptId: props.pptId,
      lang: 'zh',
      mode: 'light',
      background: '#f8fafc',
      padding: '0',
      isMobile: window.matchMedia('(max-width: 768px)').matches,
      downloadButton: ['pptx'],
      onMessage: handleDocmeeMessage,
    })
  } catch (e: any) {
    error.value = e?.message || '无法加载 Docmee PPT 预览'
  } finally {
    loading.value = false
  }
}

async function handleDocmeeMessage(message: any) {
  const type = message?.type || message?.event || message?.name
  if (type === 'invalid-token' || type === 'token-expired' || type === 'unauthorized') {
    if (!props.pptId) return
    const token = await pptApi.getRenderToken(props.resourceId, props.pptId)
    docmeeUI?.updateToken?.(token.token)
  }
}

function destroyViewer() {
  if (docmeeUI?.destroy) {
    docmeeUI.destroy()
  }
  docmeeUI = null
}

function reload() {
  initViewer()
}

function openFile() {
  if (props.fileUrl) {
    window.open(props.fileUrl, '_blank', 'noopener,noreferrer')
  }
}

onMounted(initViewer)
onBeforeUnmount(destroyViewer)
watch(() => [props.resourceId, props.pptId], initViewer)
</script>

<style scoped lang="scss">
.docmee-ppt-viewer {
  width: 100%;
}

.ppt-frame-wrap {
  position: relative;
  min-height: 720px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
}

.ppt-frame {
  width: 100%;
  height: min(78vh, 860px);
  min-height: 720px;

  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.ppt-loading,
.ppt-error,
.ppt-empty {
  padding: 28px;
  background: #ffffff;
}

.ppt-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.ppt-error,
.ppt-empty {
  display: grid;
  gap: 10px;
  justify-items: center;
  min-height: 260px;
  align-content: center;
  text-align: center;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 0.86rem;
  }
}

.ppt-error {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.ppt-error-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

@media (max-width: 768px) {
  .ppt-frame-wrap,
  .ppt-frame {
    min-height: 560px;
  }

  .ppt-frame {
    height: 72vh;
  }
}
</style>
