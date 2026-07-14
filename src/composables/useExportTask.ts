import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  exportFolder,
  cancelExportTask,
  createExportEventSource,
  downloadExportZip,
} from '@/api/resource'
import type { ExportProgress, ExportComplete } from '@/api/resource'

export type ExportStatus = 'idle' | 'exporting' | 'completed' | 'failed' | 'cancelled'

export interface ExportState {
  status: ExportStatus
  taskId: string
  folderName: string
  percent: number
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  errorMessage: string
}

export function useExportTask() {
  const state = reactive<ExportState>({
    status: 'idle',
    taskId: '',
    folderName: '',
    percent: 0,
    processedFiles: 0,
    totalFiles: 0,
    processedBytes: 0,
    totalBytes: 0,
    errorMessage: '',
  })

  const isDialogVisible = ref(false)
  const isMinimized = ref(false)

  let abortCtrl: (() => void) | null = null

  async function startExport(folderId: string, folderName: string) {
    // 重置状态
    state.status = 'exporting'
    state.taskId = ''
    state.folderName = folderName
    state.percent = 0
    state.processedFiles = 0
    state.totalFiles = 0
    state.processedBytes = 0
    state.totalBytes = 0
    state.errorMessage = ''
    isDialogVisible.value = true
    isMinimized.value = false

    try {
      const result = await exportFolder(folderId)
      state.taskId = result.taskId

      // 建立 SSE 连接
      const { abort } = createExportEventSource(result.taskId, {
        onProgress(data: ExportProgress) {
          state.processedFiles = data.processedFiles
          state.totalFiles = data.totalFiles
          state.processedBytes = data.processedBytes
          state.totalBytes = data.totalBytes
          state.percent = data.percent
        },
        onComplete(data: ExportComplete) {
          state.status = 'completed'
          state.percent = 100
          // 自动触发下载
          downloadExportZip(data.taskId, data.fileName)
          ElMessage.success('打包完成，正在下载...')
          // 延迟隐藏 UI
          setTimeout(() => {
            resetState()
          }, 3000)
        },
        onError(message: string) {
          state.status = 'failed'
          state.errorMessage = message
          ElMessage.error(message || '打包失败')
          abortCtrl = null
        },
        onCancelled() {
          state.status = 'cancelled'
          ElMessage.info('已取消打包')
          abortCtrl = null
        },
      })

      abortCtrl = abort
    } catch (err: any) {
      state.status = 'failed'
      state.errorMessage = err?.message || '发起导出失败'
      ElMessage.error(state.errorMessage)
    }
  }

  async function cancelExport() {
    if (!state.taskId) return
    try {
      await cancelExportTask(state.taskId)
      // SSE 端会收到 cancelled 事件并更新 status
    } catch (err: any) {
      ElMessage.error(err?.message || '取消失败')
    }
  }

  function minimize() {
    isMinimized.value = true
    isDialogVisible.value = false
  }

  function restore() {
    isMinimized.value = false
    isDialogVisible.value = true
  }

  function resetState() {
    abortCtrl?.()
    abortCtrl = null
    state.status = 'idle'
    state.taskId = ''
    state.percent = 0
    state.processedFiles = 0
    state.totalFiles = 0
    isDialogVisible.value = false
    isMinimized.value = false
  }

  function cleanup() {
    abortCtrl?.()
    abortCtrl = null
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    state,
    isDialogVisible,
    isMinimized,
    startExport,
    cancelExport,
    minimize,
    restore,
    resetState,
    cleanup,
  }
}
