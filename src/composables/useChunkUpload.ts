import { ref } from 'vue'
import SparkMD5 from 'spark-md5'
import { initUpload, uploadChunk, mergeChunks } from '@/api/knowledgeBase'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB per chunk

export interface UploadProgress {
  percentage: number
  status: 'parsing' | 'uploading' | 'merging' | 'success' | 'exception'
  statusText: string
}

export function useChunkUpload(knowledgeBaseId: number) {
  const uploadProgress = ref<UploadProgress>({
    percentage: 0,
    status: 'parsing',
    statusText: '',
  })

  const resetProgress = () => {
    uploadProgress.value = {
      percentage: 0,
      status: 'parsing',
      statusText: '',
    }
  }

  const computeMD5AndSlice = (file: File): Promise<{ hash: string; chunks: Blob[] }> => {
    return new Promise((resolve, reject) => {
      uploadProgress.value.status = 'parsing'
      uploadProgress.value.statusText = '正在计算文件摘要...'
      uploadProgress.value.percentage = 0

      const chunks: Blob[] = []
      let currentChunk = 0
      const chunksCount = Math.ceil(file.size / CHUNK_SIZE)
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()

      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer)
        }
        currentChunk++
        
        // 解析进度的 30% 分配给 MD5 计算
        uploadProgress.value.percentage = Math.floor((currentChunk / chunksCount) * 10)

        if (currentChunk < chunksCount) {
          loadNext()
        } else {
          const hash = spark.end()
          resolve({ hash, chunks })
        }
      }

      fileReader.onerror = () => {
        reject('文件读取发生错误')
      }

      function loadNext() {
        const start = currentChunk * CHUNK_SIZE
        const end = start + CHUNK_SIZE >= file.size ? file.size : start + CHUNK_SIZE
        const chunk = file.slice(start, end)
        chunks.push(chunk)
        fileReader.readAsArrayBuffer(chunk)
      }

      loadNext()
    })
  }

  const doUpload = async (file: File) => {
    if (!file) return null
    try {
      resetProgress()

      // 1. 切片 & 计算 MD5
      const { hash, chunks } = await computeMD5AndSlice(file)

      uploadProgress.value.status = 'uploading'
      uploadProgress.value.statusText = '准备上传...'
      uploadProgress.value.percentage = 10

      // 2. 初始化上传 (调用后端的 initUpload)
      const initRes = await initUpload({
        fileHash: hash,
        fileName: file.name,
        fileSize: file.size,
        knowledgeBaseId: knowledgeBaseId
      })

      const initData = initRes as any

      // 如果返回秒传完成
      if (initData.isFinished) {
        uploadProgress.value.percentage = 100
        uploadProgress.value.status = 'success'
        uploadProgress.value.statusText = '秒传成功'
        return initData.fileUrl
      }

      const uploadId = initData.uploadId!
      const uploadedParts = initData.uploadedParts || []
      
      const totalParts = chunks.length

      // 3. 上传未完成的分片
      let uploadedCount = uploadedParts.length
      
      const uploadPromises = chunks.map(async (chunk, index) => {
        const partNumber = index + 1
        if (uploadedParts.includes(partNumber)) {
          return Promise.resolve(true) // 已经上传的分片，直接 resolve
        }

        // 可以考虑控制并发数量，这里为了简单直接并行或你可以用 p-limit 限制并发，为了稳妥，串行或限制并发度较好
        // 此处为了性能采用并行发送。后端若有并发问题，建议自行封装并发限流工具。
        const res = await uploadChunk(uploadId, partNumber, chunk)
        
        uploadedCount++
        // 进度从 10% 到 90%
        uploadProgress.value.percentage = 10 + Math.floor((uploadedCount / totalParts) * 80)
        uploadProgress.value.statusText = `正在上传分片 (${uploadedCount}/${totalParts})...`
        return res
      })

      // 等待所有分片上传完毕 (可以通过 chunk 循环串行或者用第三方库并发限制)
      // 在这里简单实现，如果有 1000 个切片，直接 Promise.all 可能会超时，所以最好控制一下并发，或者后端无所谓的话
      
      // 并发控制函数
      const limitConcurrent = async (tasks: (() => Promise<any>)[], limit: number) => {
        const results = []
        const executing = new Set()
        for (const task of tasks) {
          const p = Promise.resolve().then(() => task())
          results.push(p)
          executing.add(p)
          const clean = () => executing.delete(p)
          p.then(clean).catch(clean)
          if (executing.size >= limit) {
             await Promise.race(executing)
          }
        }
        return Promise.all(results)
      }
      
      await limitConcurrent(
        chunks.map((chunk, index) => {
          return async () => {
            const partNumber = index + 1
            if (uploadedParts.includes(partNumber)) {
              return
            }
            await uploadChunk(uploadId, partNumber, chunk)
            uploadedCount++
            uploadProgress.value.percentage = 10 + Math.floor((uploadedCount / totalParts) * 80)
            uploadProgress.value.statusText = `正在上传分片 (${uploadedCount}/${totalParts})...`
          }
        }), 
        3 // 控制 3 个任务并发
      )


      uploadProgress.value.status = 'merging'
      uploadProgress.value.statusText = '正在合并文件...'
      uploadProgress.value.percentage = 95

      // 4. 合并分片
      const mergeRes = await mergeChunks({
        uploadId,
        fileHash: hash,
        fileName: file.name,
        fileSize: file.size,
        knowledgeBaseId: knowledgeBaseId,
        totalParts: totalParts
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
    doUpload,
    uploadProgress
  }
}
