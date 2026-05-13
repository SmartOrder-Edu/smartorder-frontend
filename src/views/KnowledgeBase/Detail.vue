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
            <span class="stat-value">{{ filteredFiles.length }}</span>
            <span class="stat-label">总文件数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon chunks"><el-icon><Grid /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ totalChunks }}</span>
            <span class="stat-label">总切片数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success"><el-icon><CircleCheckFilled /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ embeddedFilesCount }}</span>
            <span class="stat-label">向量化就绪</span>
          </div>
        </div>
      </div>

      <!-- 文件列表视图 -->
      <div class="content-section">
        <el-table :data="filteredFiles" class="files-table" style="width: 100%" v-loading="loading">
          <el-table-column label="文件名" min-width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="file-name-cell">
                <img :src="getFileIcon(row.file_extension)" class="file-icon" @error="handleImgError" />
                <div class="file-info">
                  <span class="file-name" @click="previewFile(row)">{{ row.original_name }}</span>
                  <span class="file-meta">
                    <span v-if="row.page_count">{{ row.page_count }} 页</span>
                    <span v-else-if="row.word_count">{{ formatNumber(row.word_count) }} 字</span>
                    <span v-else>无字数/页数信息</span>
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              {{ formatSize(row.file_size) }}
            </template>
          </el-table-column>
          
          <el-table-column label="解析状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.parse_status)" size="small">
                {{ getStatusText(row.parse_status, 'parse') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="分块状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.chunk_status)" size="small">
                {{ getStatusText(row.chunk_status, 'chunk') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="向量化状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.embedding_status)" size="small">
                {{ getStatusText(row.embedding_status, 'embedding') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="chunk_count" label="切片数" width="100" />
          
          <el-table-column label="上传时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="action-btns">
                <el-tooltip content="重新解析" placement="top">
                  <el-button type="primary" link icon="RefreshRight" @click="reparseFile(row)" />
                </el-tooltip>
                <el-tooltip content="预览文件" placement="top">
                  <el-button type="primary" link icon="View" @click="previewFile(row)" />
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
      </div>

      <!-- 上传弹窗模拟 -->
      <el-dialog v-model="uploadDialogVisible" title="上传文件到知识库" width="500px">
        <el-upload
          class="upload-demo"
          drag
          action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
          multiple
          :on-success="onUploadSuccess"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 PDF, DOCX, TXT, MD, PPTX 格式，单个文件不超过 50MB
            </div>
          </template>
        </el-upload>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search, Upload, Document, Grid, CircleCheckFilled, View, Delete, RefreshRight, UploadFilled } from '@element-plus/icons-vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const kbId = route.params.id

// 模拟知识库基本信息
const kbInfo = ref({
  id: Number(kbId),
  name: '计算机网络核心笔记',
  category: '课程学习'
})

// 模拟文件列表数据
interface KnowledgeFile {
  id: number
  original_name: string
  file_extension: string
  file_size: number
  page_count: number | null
  word_count: number | null
  parse_status: string
  chunk_status: string
  embedding_status: string
  chunk_count: number
  created_at: string
}

const loading = ref(false)
const searchKeyword = ref('')
const uploadDialogVisible = ref(false)

const fileList = ref<KnowledgeFile[]>([
  {
    id: 1,
    original_name: '计算机网络(第7版) 谢希仁.pdf',
    file_extension: 'pdf',
    file_size: 25430000, // 25.43 MB
    page_count: 420,
    word_count: null,
    parse_status: 'parsed',
    chunk_status: 'chunked',
    embedding_status: 'embedded',
    chunk_count: 520,
    created_at: '2026-05-13T09:30:00Z'
  },
  {
    id: 2,
    original_name: 'TCP_IP详解_卷1.pdf',
    file_extension: 'pdf',
    file_size: 45600000,
    page_count: 856,
    word_count: null,
    parse_status: 'parsing',
    chunk_status: 'pending',
    embedding_status: 'pending',
    chunk_count: 0,
    created_at: '2026-05-13T10:15:00Z'
  },
  {
    id: 3,
    original_name: '期末复习重点图表缩略版.docx',
    file_extension: 'docx',
    file_size: 2500000,
    page_count: 24,
    word_count: 12500,
    parse_status: 'parsed',
    chunk_status: 'chunked',
    embedding_status: 'embedded',
    chunk_count: 45,
    created_at: '2026-05-12T15:20:00Z'
  },
  {
    id: 4,
    original_name: '个人笔记-传输层协议分析.md',
    file_extension: 'md',
    file_size: 45000,
    page_count: null,
    word_count: 8000,
    parse_status: 'parsed',
    chunk_status: 'chunked',
    embedding_status: 'failed',
    chunk_count: 32,
    created_at: '2026-05-11T20:00:00Z'
  }
])

// 计算属性
const filteredFiles = computed(() => {
  return fileList.value.filter(file => 
    file.original_name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const totalChunks = computed(() => {
  return filteredFiles.value.reduce((sum, file) => sum + file.chunk_count, 0)
})

const embeddedFilesCount = computed(() => {
  return filteredFiles.value.filter(f => f.embedding_status === 'embedded').length
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
    case 'parsed':
    case 'chunked':
    case 'embedded': return 'success'
    case 'parsing':
    case 'chunking':
    case 'embedding': return 'primary'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string, flow: string) => {
  const map: Record<string, any> = {
    parse: { pending: '待解析', parsing: '解析中', parsed: '解析完成', failed: '解析失败' },
    chunk: { pending: '待分块', chunking: '分块中', chunked: '分块完成', failed: '分块失败' },
    embedding: { pending: '待向量化', embedding: '向量化中', embedded: '向量化完成', failed: '向量化失败' }
  }
  return map[flow][status] || '未知'
}

const getFileIcon = (ext: string) => {
  // 这里可以替换为真实的 svg 或在线图标链接
  const iconBase = 'https://api.iconify.design/vscode-icons/file-type-'
  if (['pdf', 'word', 'powerpoint', 'excel', 'markdown'].includes(ext)) {
    return `${iconBase}${ext}.svg`
  }
  if (ext === 'docx' || ext === 'doc') return `${iconBase}word.svg`
  if (ext === 'pptx' || ext === 'ppt') return `${iconBase}powerpoint.svg`
  if (ext === 'xlsx' || ext === 'xls') return `${iconBase}excel.svg`
  if (ext === 'md') return `${iconBase}markdown.svg`
  if (ext === 'txt') return `${iconBase}text.svg`
  return `${iconBase}text.svg`
}

const handleImgError = (e: Event) => {
  // 如果图标加载失败，回退为一个默认 SVG
  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23909399"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 9V3.5L18.5 9H13z"/></svg>'
}

// 交互操作
const handleUpload = () => {
  uploadDialogVisible.value = true
}

const onUploadSuccess = () => {
  ElMessage.success('文件上传成功并已加入处理队列')
  uploadDialogVisible.value = false
  // 模拟添加新文件
  fileList.value.unshift({
    id: Date.now(),
    original_name: '新上传的文件.pdf',
    file_extension: 'pdf',
    file_size: 1024000,
    page_count: 10,
    word_count: null,
    parse_status: 'pending',
    chunk_status: 'pending',
    embedding_status: 'pending',
    chunk_count: 0,
    created_at: new Date().toISOString()
  })
}

const previewFile = (file: KnowledgeFile) => {
  ElMessage.info(`预览文件：${file.original_name}`)
}

const reparseFile = (file: KnowledgeFile) => {
  ElMessage.success(`已将 ${file.original_name} 重新加入解析队列`)
  file.parse_status = 'pending'
  file.chunk_status = 'pending'
  file.embedding_status = 'pending'
}

const deleteFile = (file: KnowledgeFile) => {
  ElMessageBox.confirm(
    `确定要删除文件 "${file.original_name}" 吗？关联的知识切片和向量都会被一并移除。`,
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
</style>