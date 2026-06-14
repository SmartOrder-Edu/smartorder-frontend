import { ref } from 'vue'
import SparkMD5 from 'spark-md5'
import { agentAttachmentApi, type AttachmentUploadResp } from '@/api/agentAttachment'

const CHUNK_SIZE = 5 * 1024 * 1024

export interface AgentAttachmentUploadProgress {
  percentage: number
  status: 'idle' | 'hashing' | 'uploading' | 'merging' | 'success' | 'exception'
  statusText: string
}

export function useAgentAttachmentUpload() {
  const uploadProgress = ref<AgentAttachmentUploadProgress>({
    percentage: 0,
    status: 'idle',
    statusText: '',
  })

  function resetProgress() {
    uploadProgress.value = {
      percentage: 0,
      status: 'idle',
      statusText: '',
    }
  }

  function computeMD5AndSlice(file: File): Promise<{ hash: string; chunks: Blob[] }> {
    return new Promise((resolve, reject) => {
      uploadProgress.value.status = 'hashing'
      uploadProgress.value.statusText = '正在计算文件摘要...'
      uploadProgress.value.percentage = 0

      const chunks: Blob[] = []
      const chunksCount = Math.ceil(file.size / CHUNK_SIZE)
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()
      let currentChunk = 0

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer)
        }
        currentChunk++
        uploadProgress.value.percentage = Math.floor((currentChunk / chunksCount) * 10)
        if (currentChunk < chunksCount) {
          loadNext()
        } else {
          resolve({ hash: spark.end(), chunks })
        }
      }

      fileReader.onerror = () => reject(new Error('文件读取发生错误'))

      function loadNext() {
        const start = currentChunk * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        chunks.push(chunk)
        fileReader.readAsArrayBuffer(chunk)
      }

      loadNext()
    })
  }

  async function limitConcurrent(tasks: (() => Promise<void>)[], limit: number) {
    const executing = new Set<Promise<void>>()
    const results: Promise<void>[] = []
    for (const task of tasks) {
      const promise = Promise.resolve().then(task)
      results.push(promise)
      executing.add(promise)
      const clean = () => executing.delete(promise)
      promise.then(clean).catch(clean)
      if (executing.size >= limit) {
        await Promise.race(executing)
      }
    }
    await Promise.all(results)
  }

  async function upload(file: File, conversationId?: string): Promise<AttachmentUploadResp> {
    resetProgress()
    try {
      const { hash, chunks } = await computeMD5AndSlice(file)
      uploadProgress.value.status = 'uploading'
      uploadProgress.value.statusText = '准备上传...'
      uploadProgress.value.percentage = 10

      const initRes = await agentAttachmentApi.initUpload({
        conversationId,
        fileHash: hash,
        fileName: file.name,
        fileSize: file.size,
      })

      if (initRes.isFinished) {
        uploadProgress.value.percentage = 100
        uploadProgress.value.status = 'success'
        uploadProgress.value.statusText = '上传成功'
        return initRes
      }

      const uploadId = initRes.uploadId
      if (!uploadId) {
        throw new Error('上传初始化失败')
      }
      const uploadedParts = initRes.uploadedParts || []
      const totalParts = chunks.length
      let uploadedCount = uploadedParts.length

      await limitConcurrent(
        chunks.map((chunk, index) => async () => {
          const partNumber = index + 1
          if (uploadedParts.includes(partNumber)) {
            return
          }
          await agentAttachmentApi.uploadChunk(uploadId, partNumber, chunk)
          uploadedCount++
          uploadProgress.value.percentage = 10 + Math.floor((uploadedCount / totalParts) * 80)
          uploadProgress.value.statusText = `正在上传分片 (${uploadedCount}/${totalParts})...`
        }),
        3,
      )

      uploadProgress.value.status = 'merging'
      uploadProgress.value.statusText = '正在合并文件...'
      uploadProgress.value.percentage = 95

      const mergeRes = await agentAttachmentApi.mergeUpload({
        conversationId: initRes.conversationId,
        uploadId,
        fileHash: hash,
        fileName: file.name,
        fileSize: file.size,
        totalParts,
      })

      uploadProgress.value.percentage = 100
      uploadProgress.value.status = 'success'
      uploadProgress.value.statusText = '上传成功'
      return mergeRes
    } catch (error: any) {
      uploadProgress.value.status = 'exception'
      uploadProgress.value.statusText = error?.message || '上传失败'
      throw error
    }
  }

  return {
    upload,
    uploadProgress,
    resetProgress,
  }
}
