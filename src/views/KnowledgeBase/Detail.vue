<template>
  <AppLayout>
    <div class="kb-detail-page">
      <!-- 顶部导航和操作区 -->
      <div class="page-header">
        <div class="header-left">
          <el-button icon="ArrowLeft" circle @click="$router.push('/knowledge-base')" class="back-btn" />
          <div class="title-wrap">
            <h1 class="page-title">{{ kbInfo.name }}</h1>
            <el-tag size="small" type="info">{{ kbInfo.category }}</el-tag>
          </div>
        </div>
        <div class="header-right">
          <el-input v-model="searchKeyword" placeholder="搜索文件名..." prefix-icon="Search" clearable style="width: 250px; margin-right: 16px;" />
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
        </div>
      </div>

      <!-- 概览数据 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon docs"><el-icon><Document /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ detailStats.fileCount }}</span>
            <span class="stat-label">总文件数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon chunks"><el-icon><Grid /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ detailStats.chunkCount }}</span>
            <span class="stat-label">总切片数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success"><el-icon><CircleCheckFilled /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ detailStats.embeddedFileCount }}</span>
            <span class="stat-label">向量化就绪</span>
          </div>
        </div>
      </div>

      <!-- 文件列表视图 -->
      <div 
        class="content-section"
        v-infinite-scroll="() => fetchFileList(true)"
        :infinite-scroll-disabled="loading || !hasMore"
        infinite-scroll-distance="50"
      >
        <el-table :data="filteredFiles" class="files-table" style="width: 100%" v-loading="loading && pageNum === 1" stripe highlight-current-row :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
          <el-table-column label="文件名" min-width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="file-name-cell">
                <img :src="getFileIcon(row.fileExtension)" class="file-icon" @error="handleImgError" />
                <div class="file-info">
                  <span class="file-name" @click="previewFile(row)">{{ row.originalName }}</span>
                  <span class="file-meta">
                    <span v-if="row.pageCount">{{ row.pageCount }} 页</span>
                    <span v-else-if="row.wordCount">{{ formatNumber(row.wordCount) }} 字</span>
                    <span v-else>无字数/页数信息</span>
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              {{ formatSize(row.fileSize) }}
            </template>
          </el-table-column>
          
          <el-table-column label="解析状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.parseStatus)" size="small">
                {{ getStatusText(row.parseStatus, 'parse') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="分块状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.chunkStatus)" size="small">
                {{ getStatusText(row.chunkStatus, 'chunk') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="向量化状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.embeddingStatus)" size="small">
                {{ getStatusText(row.embeddingStatus, 'embedding') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="chunkCount" label="切片数" width="100" />
          
          <el-table-column label="上传时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="160" align="right">
            <template #default="{ row }">
              <div class="action-btns">
                <el-tooltip content="查看知识图谱" placement="top">
                  <el-button type="primary" link icon="Connection" @click="viewKnowledgeGraph(row)" />
                </el-tooltip>
                <el-tooltip content="预览文件" placement="top">
                  <el-button type="primary" link icon="View" @click="previewFile(row)" />
                </el-tooltip>
                <el-tooltip content="下载" placement="top">
                  <el-button type="primary" link icon="Download" @click="downloadFile(row)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link icon="Delete" @click="deleteFile(row)" />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="该知识库暂无文件">
              <el-button type="primary" @click="handleUpload">立即上传</el-button>
            </el-empty>
          </template>
        </el-table>
        
        <!-- 加载状态提示 -->
        <div class="list-bottom-tips" v-if="fileList.length > 0">
          <div v-if="loading" class="loading-tips">
            <el-icon class="is-loading"><Loading /></el-icon> 正在加载更多...
          </div>
          <div v-else-if="!hasMore" class="no-more-tips">
            没有更多文件了
          </div>
        </div>
      </div>

      <!-- 上传弹窗模拟 -->
      <el-dialog v-model="uploadDialogVisible" title="上传文件到知识库" width="500px" @closed="onDialogClosed">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="true"
          :http-request="customUploadRequest"
          :show-file-list="false"
          :disabled="isUploading"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 PDF, DOCX, TXT, MD, PPTX 格式，单个文件不超过 50MB
            </div>
            <!-- 自定义进度条 -->
            <div v-if="isUploading || uploadProgress.percentage > 0" style="margin-top: 15px;">
              <el-progress :percentage="uploadProgress.percentage" :status="uploadProgress.status === 'exception' ? 'exception' : (uploadProgress.percentage === 100 ? 'success' : undefined)"></el-progress>
              <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: center;">
                {{ uploadProgress.statusText }}
              </div>
            </div>
          </template>
        </el-upload>
      </el-dialog>

      <!-- 文件预览弹窗 -->
      <el-dialog
        v-model="previewDialogVisible"
        width="80%"
        top="5vh"
        custom-class="preview-dialog"
        destroy-on-close
      >
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 20px;">
            <span>{{ currentPreviewFile ? '预览 - ' + currentPreviewFile.originalName : '文件预览' }}</span>
            <el-button type="primary" :icon="Download" @click="currentPreviewFile && downloadFile(currentPreviewFile)" v-if="currentPreviewFile">
              下载
            </el-button>
          </div>
        </template>
        <div class="preview-container" v-if="currentPreviewFile">
          <!-- 图片预览 -->
          <div v-if="isImage(currentPreviewFile.fileExtension)" class="preview-center">
            <el-image
              :src="currentPreviewFile.fileUrl"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              :preview-src-list="[currentPreviewFile.fileUrl]"
              :preview-teleported="true"
              :z-index="9999"
              :initial-index="0"
              fit="contain"
              class="preview-image"
            />
          </div>
          <!-- 视频预览 -->
          <div v-else-if="isVideo(currentPreviewFile.fileExtension)" class="preview-center">
            <video :src="currentPreviewFile.fileUrl" controls class="preview-media"></video>
          </div>
          <!-- 音频预览 -->
          <div v-else-if="isAudio(currentPreviewFile.fileExtension)" class="preview-center">
            <audio :src="currentPreviewFile.fileUrl" controls class="preview-media"></audio>
          </div>
          <!-- Word 预览 -->
          <div v-else-if="isWord(currentPreviewFile.fileExtension)" class="preview-full">
            <vue-office-docx :src="currentPreviewFile.fileUrl" style="height: 100%;" />
          </div>
          <!-- Excel 预览 -->
          <div v-else-if="isExcel(currentPreviewFile.fileExtension)" class="preview-full">
            <vue-office-excel :src="currentPreviewFile.fileUrl" style="height: 100%;" />
          </div>
          <!-- PDF 预览 -->
          <div v-else-if="isPdf(currentPreviewFile.fileExtension)" class="preview-full">
            <vue-office-pdf :src="currentPreviewFile.fileUrl" style="height: 100%;" />
          </div>
          <!-- TXT / MD 预览 -->
          <div v-else-if="isTxtOrMd(currentPreviewFile.fileExtension)" class="preview-full text-preview-container" v-loading="mdLoading">
             <MarkdownRenderer v-if="mdContent" :content="mdContent" class="md-content" />
          </div>
          <!-- 无法通过内置方案预览的文档 -->
          <div v-else class="preview-unsupported">
            <el-icon class="icon"><DocumentDelete /></el-icon>
            <p>当前格式暂不支持通过浏览器直接预览</p>
            <el-button type="primary" tag="a" :href="currentPreviewFile.fileUrl" target="_blank" download>
              下载文件后本地查看
            </el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 知识图谱弹窗 -->
      <el-dialog
        v-model="graphDialogVisible"
        :title="'知识图谱 - ' + currentGraphName"
        width="70%"
        top="5vh"
        custom-class="graph-dialog"
        destroy-on-close
      >
        <div class="graph-dialog-content" v-loading="graphLoading">
          <KnowledgeGraphPreview :graph="graphData" v-if="graphData.nodes.length > 0" />
          <el-empty v-else-if="!graphLoading" description="暂无知识图谱数据" />
        </div>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { ArrowLeft, Search, Upload, Document, Grid, CircleCheckFilled, View, Delete, Connection, UploadFilled, Loading, DocumentDelete, Download } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import KnowledgeGraphPreview from '@/components/plan/KnowledgeGraphPreview.vue'
import { useChunkUpload } from '@/composables/useChunkUpload'
import { 
  getKnowledgeBaseDetailStats, 
  getKnowledgeFileList, 
  getFileKnowledgeGraph,
  type KnowledgeBaseDetailStatsVO, 
  type KnowledgeFilePageVO,
  type KnowledgeGraphVO
} from '@/api/knowledgeBase'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import VueOfficePdf from '@vue-office/pdf'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'

const route = useRoute()
const kbId = route.params.id

const { doUpload, uploadProgress } = useChunkUpload(Number(kbId))
const isUploading = ref(false)

const detailStats = ref<KnowledgeBaseDetailStatsVO>({
  fileCount: 0,
  chunkCount: 0,
  embeddedFileCount: 0
})

const fetchDetailStats = async () => {
  try {
    const stats = await getKnowledgeBaseDetailStats(Number(kbId))
    if (stats) {
      detailStats.value = stats
    }
  } catch (error) {
    console.error('获取知识库详细统计信息失败:', error)
  }
}

onMounted(() => {
  fetchDetailStats()
  if (kbId) {
    fetchFileList()
  }
})

const onDialogClosed = () => {
  if (!isUploading.value) {
    uploadProgress.value.percentage = 0
    uploadProgress.value.statusText = ''
  }
}

const customUploadRequest = async (options: UploadRequestOptions) => {
  try {
    isUploading.value = true
    const url = await doUpload(options.file)
    ElMessage.success('文件上传成功并已加入处理队列')
    
    // 模拟添加新文件，将其转化为驼峰命名的VO结构
    fileList.value.unshift({
      id: Date.now(),
      originalName: options.file.name,
      fileUrl: '',
      fileExtension: options.file.name.split('.').pop()?.toLowerCase() || '',
      mimeType: options.file.type,
      fileSize: options.file.size,
      pageCount: 0,
      wordCount: 0,
      parseStatus: 'pending',
      chunkStatus: 'pending',
      embeddingStatus: 'pending',
      chunkCount: 0,
      createdAt: new Date().toISOString()
    })
    
    setTimeout(() => {
      uploadDialogVisible.value = false
      isUploading.value = false
    }, 1500)
    
  } catch (error: any) {
    ElMessage.error(error?.message || '文件上传失败')
    isUploading.value = false
  }
}
const kbInfo = ref({
  id: Number(kbId),
  name: '计算机网络核心笔记',
  category: '课程学习'
})

// 列表和分页数据
const loading = ref(false)
const searchKeyword = ref('')
const uploadDialogVisible = ref(false)

const fileList = ref<KnowledgeFilePageVO[]>([])
const pageNum = ref(1)
const pageSize = ref(15)
const hasMore = ref(true)

// 获取文件列表
const fetchFileList = async (isLoadMore = false) => {
  if (loading.value || (!hasMore.value && isLoadMore)) return
  
  // 如果不是加载更多（即刷新/首次加载），重置页码状态
  if (!isLoadMore) {
    pageNum.value = 1
    hasMore.value = true
  }
  
  loading.value = true

  try {
    const res = await getKnowledgeFileList({
      knowledgeBaseId: Number(kbId),
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })

    if (res) {
      if (isLoadMore) {
        fileList.value.push(...res.records)
      } else {
        fileList.value = res.records
      }

      // 用更靠谱的分页判断：如果后端返回的数据条数比 pageSize 小，就说明没数据了
      if (res.records.length < pageSize.value) {
        hasMore.value = false
      } else {
        hasMore.value = true
        pageNum.value++
      }
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 模拟文件上传新结构（可选修改）

// 计算属性
const filteredFiles = computed(() => {
  return fileList.value.filter(file => 
    file.originalName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 工具方法
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatNumber = (num: number) => {
  return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num.toString()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'processing': return 'primary'
    case 'failed': return 'danger'
    case 'pending': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string, flow: string) => {
  const map: Record<string, any> = {
    parse: { pending: '待解析', processing: '解析中', success: '解析完成', failed: '解析失败' },
    chunk: { pending: '待分块', processing: '分块中', success: '分块完成', failed: '分块失败' },
    embedding: { pending: '待向量化', processing: '向量化中', success: '向量化完成', failed: '向量化失败' }
  }
  return map[flow][status] || '未知'
}

const getFileIcon = (ext: string) => {
  const iconBase = 'https://api.iconify.design/vscode-icons/file-type-'
  if (!ext) return `${iconBase}text.svg`
  
  switch (ext.toLowerCase()) {
    case 'txt': 
    case 'md': 
      return ext.toLowerCase() === 'md' ? `${iconBase}markdown.svg` : `${iconBase}text.svg`
    case 'pdf': 
      return `${iconBase}pdf2.svg`
    case 'doc': 
    case 'docx': 
      return `${iconBase}word.svg`
    case 'xls': 
    case 'xlsx': 
      return `${iconBase}excel.svg`
    case 'ppt': 
    case 'pptx': 
      return `${iconBase}powerpoint.svg`
    case 'png': 
    case 'jpg': 
    case 'jpeg': 
    case 'bmp': 
    case 'gif': 
      return `${iconBase}image.svg`
    case 'mp3': 
    case 'wav': 
      return `${iconBase}audio.svg`
    case 'mp4': 
    case 'mkv': 
    case 'webm': 
      return `${iconBase}video.svg`
    default: 
      return `${iconBase}text.svg`
  }
}

const handleImgError = (e: Event) => {
  // 如果图标加载失败，回退为一个默认 SVG
  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23909399"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 9V3.5L18.5 9H13z"/></svg>'
}

// 交互操作
const handleUpload = () => {
  uploadDialogVisible.value = true
}

// 预览状态
const previewDialogVisible = ref(false)
const currentPreviewFile = ref<KnowledgeFilePageVO | null>(null)
const mdContent = ref('')
const mdLoading = ref(false)

const isImage = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext?.toLowerCase())
const isVideo = (ext: string) => ['mp4', 'webm', 'ogg', 'mkv'].includes(ext?.toLowerCase())
const isAudio = (ext: string) => ['mp3', 'wav', 'ogg', 'aac'].includes(ext?.toLowerCase())
const isPdf = (ext: string) => ['pdf'].includes(ext?.toLowerCase())
const isWord = (ext: string) => ['doc', 'docx'].includes(ext?.toLowerCase())
const isExcel = (ext: string) => ['xls', 'xlsx', 'csv'].includes(ext?.toLowerCase())
const isTxtOrMd = (ext: string) => ['txt', 'md'].includes(ext?.toLowerCase())

const previewFile = async (file: KnowledgeFilePageVO) => {
  if (!file.fileUrl) {
    ElMessage.warning('该文件暂无预览链接')
    return
  }
  currentPreviewFile.value = file
  previewDialogVisible.value = true

  if (isTxtOrMd(file.fileExtension)) {
    mdLoading.value = true
    mdContent.value = ''
    try {
      const response = await fetch(file.fileUrl)
      if (!response.ok) throw new Error('文件请求失败')
      const text = await response.text()
      mdContent.value = text
    } catch (error) {
      console.error('文本预览失败', error)
      ElMessage.error('文本文件解析预览失败')
    } finally {
      mdLoading.value = false
    }
  }
}

const graphDialogVisible = ref(false)
const graphLoading = ref(false)
const currentGraphName = ref('')
const graphData = ref<{
  nodes: { name: string; category?: string; importance?: number }[]
  edges: { from: string; to: string; type?: string }[]
}>({ nodes: [], edges: [] })

const viewKnowledgeGraph = async (file: KnowledgeFilePageVO) => {
  currentGraphName.value = file.originalName
  graphDialogVisible.value = true
  graphLoading.value = true
  // @ts-ignore
  graphData.value = { nodes: [], edges: [] }
  try {
    const res: any = await getFileKnowledgeGraph(file.id)
    const data = res?.data || res
    if (data) {
      graphData.value = {
        nodes: data.nodes || [],
        edges: (data.edges || []).map((e: any) => ({
          from: e.source,
          to: e.target,
          type: e.relationType || e.description
        }))
      }
    }
  } catch (error) {
    console.error('获取知识图谱失败', error)
  } finally {
    graphLoading.value = false
  }
}

const downloadFile = (file: KnowledgeFilePageVO) => {
  if (!file.fileUrl) {
    ElMessage.warning('该文件暂无下载链接')
    return
  }
  const link = document.createElement('a')
  link.href = file.fileUrl
  link.download = file.originalName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('开始下载文件')
}

const deleteFile = (file: KnowledgeFilePageVO) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${file.originalName}" 吗？关联的知识切片和向量都会被一并移除。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    fileList.value = fileList.value.filter(f => f.id !== file.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(() => {
  if (kbId) {
    // 这里可以发起请求获取知识库详情和文件列表
    // loadKbDetails(kbId)
  }
})
</script>

<style scoped lang="scss">
.kb-detail-page {
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: var(--el-bg-color);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-btn {
      border: none;
      background: var(--el-fill-color-light);
      &:hover {
        background: var(--el-fill-color);
        color: var(--el-color-primary);
      }
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;

      .page-title {
        font-size: 22px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.02);

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.docs {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
    &.chunks {
      background: var(--el-color-warning-light-9);
      color: var(--el-color-warning);
    }
    &.success {
      background: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
}

.content-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.02);
  height: 600px;
  overflow-y: auto;
}

.files-table {
  .file-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .file-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .file-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .file-meta {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }
  }

  .action-btns {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.list-bottom-tips {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .loading-tips {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
.preview-container {
  min-height: 400px;
  height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  overflow: hidden;

  .preview-center {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    
    .preview-image {
      max-width: 100%;
      max-height: 100%;
    }

    .preview-media {
      max-width: 90%;
      max-height: 90%;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .preview-full {
    width: 100%;
    height: 100%;
  }

  .preview-unsupported {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--el-text-color-secondary);

    .icon {
      font-size: 64px;
      color: var(--el-text-color-placeholder);
    }
  }

  .text-preview-container {
    background: #fff;
    overflow-y: auto;
    padding: 20px;
    .md-content {
      text-align: left;
    }
  }

  .graph-dialog-content {
    height: 60vh;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
}
</style>