<template>
  <div class="rag-reference-selector">
    <!-- 触发按钮 -->
    <el-button
      :type="hasReferences ? 'primary' : 'default'"
      :class="{ 'has-references': hasReferences }"
      @click="dialogVisible = true"
      size="small"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {{ hasReferences ? `已引用 ${selectedKbCount + selectedFileCount} 项` : '引用知识库' }}
    </el-button>

    <!-- 已选引用预览标签 -->
    <div v-if="hasReferences" class="reference-tags">
      <el-tag
        v-for="ref in selectedReferences"
        :key="ref.id"
        closable
        @close="removeReference(ref)"
        size="small"
        :type="ref.type === 'kb' ? 'success' : 'info'"
      >
        {{ ref.type === 'kb' ? '📚' : '📄' }} {{ ref.name }}
      </el-tag>
      <el-button
        v-if="hasReferences"
        link
        type="danger"
        size="small"
        @click="clearAll"
      >
        清空
      </el-button>
    </div>

    <!-- 选择对话框 -->
    <el-dialog
      v-model="dialogVisible"
      width="700px"
      :close-on-click-modal="false"
      class="rag-selector-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="header-content">
            <h3 class="dialog-title">引用知识库资源</h3>
            <p class="dialog-subtitle">选择知识库或文件来增强AI回答</p>
          </div>
        </div>
      </template>
      <div class="selector-content">
        <!-- 模式切换 -->
        <div class="mode-tabs">
          <button
            :class="{ active: mode === 'kb' }"
            @click="switchMode('kb')"
          >
            知识库引用
          </button>
          <button
            :class="{ active: mode === 'file' }"
            @click="switchMode('file')"
          >
            文件引用
          </button>
        </div>

        <!-- 知识库列表模式 -->
        <div v-if="mode === 'kb'" class="kb-list-mode">
          <div class="search-bar">
            <el-input
              v-model="kbSearchKeyword"
              placeholder="搜索知识库..."
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
          <div class="kb-list" v-loading="loadingKbList">
            <div
              v-for="kb in filteredKnowledgeBases"
              :key="kb.id"
              class="kb-item"
              :class="{
                selected: isKbSelected(kb.id),
                'has-files': hasKbFiles(kb.id)
              }"
              @click="toggleKb(kb)"
            >
              <div class="kb-cover">
                <img v-if="kb.coverUrl" :src="kb.coverUrl" />
                <div v-else class="default-cover">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
              </div>
              <div class="kb-info">
                <div class="kb-name">{{ kb.name }}</div>
                <div class="kb-meta">
                  <span>{{ kb.category }}</span>
                  <span>· {{ kb.fileCount || 0 }} 个文件</span>
                  <span v-if="hasKbFiles(kb.id)" class="kb-badge-selected">
                    已选 {{ getKbFileCount(kb.id) }} 个文件
                  </span>
                </div>
              </div>
              <div class="kb-check">
                <el-checkbox :model-value="isKbSelected(kb.id)" @change="toggleKb(kb)" />
              </div>
            </div>
          </div>
          <el-empty v-if="!loadingKbList && filteredKnowledgeBases.length === 0" description="暂无知识库" />
        </div>

        <!-- 文件列表模式 -->
        <div v-if="mode === 'file'" class="file-list-mode">
          <div class="kb-selector">
            <el-select
              v-model="selectedKbForFile"
              placeholder="选择知识库"
              @change="onKbChange"
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="kb in knowledgeBases"
                :key="kb.id"
                :label="kb.name"
                :value="kb.id"
              />
            </el-select>
          </div>

          <div v-if="selectedKbForFile" class="file-list-content">
            <div class="search-bar">
              <el-input
                v-model="fileSearchKeyword"
                placeholder="搜索文件..."
                prefix-icon="Search"
                clearable
                size="small"
              />
            </div>

            <!-- 当前选择统计 -->
            <div v-if="selectedFileCount > 0" class="file-selection-summary">
              <span class="summary-text">
                已选择 <strong>{{ selectedFileCount }}</strong> 个文件（来自 <strong>{{ distinctKbCount }}</strong> 个知识库）
              </span>
            </div>

            <div class="file-list" v-loading="loadingFileList">
              <div
                v-for="file in filteredFiles"
                :key="file.id"
                class="file-item"
                :class="{ selected: isFileSelected(file.id) }"
                @click="toggleFile(file)"
              >
                <div class="file-icon">
                  <img :src="getFileIcon(file.fileExtension)" @error="handleImgError" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.originalName }}</div>
                  <div class="file-meta">
                    <span>{{ formatSize(file.fileSize) }}</span>
                    <span>· {{ file.chunkCount || 0 }} 个切片</span>
                    <span v-if="hasOtherKbFiles" class="kb-badge">
                      来自 {{ knowledgeBases.find(k => k.id === selectedKbForFile)?.name || '当前知识库' }}
                    </span>
                  </div>
                </div>
                <div class="file-check">
                  <el-checkbox :model-value="isFileSelected(file.id)" @change="toggleFile(file)" />
                </div>
              </div>
            </div>
            <el-empty v-if="!loadingFileList && filteredFiles.length === 0" description="该知识库暂无文件" />
          </div>
          <el-empty v-else description="请先选择一个知识库" />
        </div>

        <!-- 引用规则提示 -->
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            <span style="font-size: 13px;">引用规则说明</span>
          </template>
          <div style="font-size: 12px; line-height: 1.6;">
            <div style="margin-bottom: 4px;">✅ 可以混用不同知识库的文件</div>
            <div style="margin-bottom: 4px;">✅ 可以混用知识库和其他知识库的文件</div>
            <div>❌ 不能同时引用同一知识库的整体和文件</div>
          </div>
        </el-alert>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <div class="selection-summary">
            <div class="summary-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: var(--primary-color);">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span class="summary-text">
                已选 <strong>{{ selectedKbCount }}</strong> 个知识库，
                <strong>{{ selectedFileCount }}</strong> 个文件
                <span v-if="selectedFileCount > 0 && distinctKbCount > 1" class="summary-hint">
                  （来自 {{ distinctKbCount }} 个知识库）
                </span>
              </span>
            </div>
          </div>
          <div class="dialog-actions">
            <el-button size="large" @click="dialogVisible = false" class="cancel-btn">取消</el-button>
            <el-button size="large" type="primary" @click="confirmSelection" class="confirm-btn">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getKnowledgeBaseList,
  getKnowledgeFileList,
  type KnowledgeBaseListRespVO,
  type KnowledgeFilePageVO
} from '@/api/knowledgeBase'
import type { RagReference } from '@/composables/useAgentChat'

const props = defineProps<{
  modelValue: RagReference[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RagReference[]]
}>()

// 状态管理
const dialogVisible = ref(false)
const mode = ref<'kb' | 'file'>('kb')
const kbSearchKeyword = ref('')
const fileSearchKeyword = ref('')
const selectedKbForFile = ref<number | null>(null)

// 数据加载
const loadingKbList = ref(false)
const loadingFileList = ref(false)
const knowledgeBases = ref<KnowledgeBaseListRespVO[]>([])
const files = ref<KnowledgeFilePageVO[]>([])

// 已选择的引用
const selectedReferences = ref<RagReference[]>([])

// 计算属性
const hasReferences = computed(() => selectedReferences.value.length > 0)
const selectedKbCount = computed(() => selectedReferences.value.filter(r => r.type === 'kb').length)
const selectedFileCount = computed(() => selectedReferences.value.filter(r => r.type === 'file').length)
const distinctKbCount = computed(() => {
  const fileKbIds = new Set(selectedReferences.value
    .filter(r => r.type === 'file')
    .map(r => r.kbId)
  )
  return fileKbIds.size
})

const hasOtherKbFiles = computed(() => {
  return selectedReferences.value.some(r =>
    r.type === 'file' &&
    r.kbId !== String(selectedKbForFile.value)
  )
})

const filteredKnowledgeBases = computed(() => {
  if (!kbSearchKeyword.value) return knowledgeBases.value
  return knowledgeBases.value.filter(kb =>
    kb.name.toLowerCase().includes(kbSearchKeyword.value.toLowerCase()) ||
    kb.category?.toLowerCase().includes(kbSearchKeyword.value.toLowerCase())
  )
})

const filteredFiles = computed(() => {
  if (!fileSearchKeyword.value) return files.value
  return files.value.filter(file =>
    file.originalName.toLowerCase().includes(fileSearchKeyword.value.toLowerCase())
  )
})

// 同步 props
watch(() => props.modelValue, (newVal) => {
  selectedReferences.value = [...newVal]
}, { immediate: true })

// 方法
const loadKnowledgeBases = async () => {
  loadingKbList.value = true
  try {
    const list = await getKnowledgeBaseList()
    knowledgeBases.value = list || []
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    ElMessage.error('获取知识库列表失败')
  } finally {
    loadingKbList.value = false
  }
}

const loadFiles = async (kbId: number) => {
  loadingFileList.value = true
  try {
    const result = await getKnowledgeFileList({
      knowledgeBaseId: kbId,
      pageNum: 1,
      pageSize: 100
    })
    files.value = result?.records || []
  } catch (error) {
    console.error('获取文件列表失败:', error)
    ElMessage.error('获取文件列表失败')
  } finally {
    loadingFileList.value = false
  }
}

const switchMode = (newMode: 'kb' | 'file') => {
  // 切换模式时不再清空，因为知识库和不同知识库的文件可以混用
  mode.value = newMode
}

const isKbSelected = (kbId: number) => {
  return selectedReferences.value.some(r => r.type === 'kb' && r.id === String(kbId))
}

const isFileSelected = (fileId: number) => {
  return selectedReferences.value.some(r => r.type === 'file' && r.id === String(fileId))
}

const hasKbFiles = (kbId: number) => {
  return selectedReferences.value.some(r => r.type === 'file' && r.kbId === String(kbId))
}

const getKbFileCount = (kbId: number) => {
  return selectedReferences.value.filter(r => r.type === 'file' && r.kbId === String(kbId)).length
}

const toggleKb = (kb: KnowledgeBaseListRespVO) => {
  const isSelected = isKbSelected(kb.id)
  if (isSelected) {
    selectedReferences.value = selectedReferences.value.filter(r => !(r.type === 'kb' && r.id === String(kb.id)))
  } else {
    // 检查是否已经选择了该知识库的文件
    const sameKbFiles = selectedReferences.value.filter(r => r.type === 'file' && r.kbId === String(kb.id))
    if (sameKbFiles.length > 0) {
      ElMessage.warning(`已选择知识库"${kb.name}"的 ${sameKbFiles.length} 个文件，不能同时引用该知识库整体`)
      return
    }

    selectedReferences.value.push({
      id: String(kb.id),
      name: kb.name,
      type: 'kb',
      kbId: String(kb.id),
      kbName: kb.name
    })
  }
}

const toggleFile = (file: KnowledgeFilePageVO) => {
  const isSelected = isFileSelected(file.id)
  const currentKbId = String(selectedKbForFile.value)

  if (isSelected) {
    selectedReferences.value = selectedReferences.value.filter(r => !(r.type === 'file' && r.id === String(file.id)))
  } else {
    // 检查是否已经选择了该知识库整体
    const sameKb = selectedReferences.value.find(r => r.type === 'kb' && r.kbId === currentKbId)
    if (sameKb) {
      const kb = knowledgeBases.value.find(k => k.id === selectedKbForFile.value)
      ElMessage.warning(`已选择知识库"${kb?.name}"整体，不能同时选择该知识库的文件`)
      return
    }

    // 可以选择不同知识库的文件，不需要清空
    const kb = knowledgeBases.value.find(k => k.id === selectedKbForFile.value)
    selectedReferences.value.push({
      id: String(file.id),
      name: file.originalName,
      type: 'file',
      kbId: currentKbId,
      kbName: kb?.name
    })
  }
}

const onKbChange = (kbId: number) => {
  // 切换知识库下拉框时，不需要清空文件（可以混用不同知识库的文件）
  selectedKbForFile.value = kbId
  loadFiles(kbId)
}

const removeReference = (ref: RagReference) => {
  selectedReferences.value = selectedReferences.value.filter(r => r.id !== ref.id)
}

const clearAll = () => {
  selectedReferences.value = []
}

const confirmSelection = () => {
  emit('update:modelValue', selectedReferences.value)
  dialogVisible.value = false
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
    default:
      return `${iconBase}text.svg`
  }
}

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23909399"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 9V3.5L18.5 9H13z"/></svg>'
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
  loadKnowledgeBases()
})
</script>

<style scoped lang="scss">
.rag-reference-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;

  :deep(.el-button) {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }
}

/* 对话框样式 */
:deep(.rag-selector-dialog) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
  }

  .el-dialog__body {
    padding: var(--spacing-lg);
  }

  .el-dialog__footer {
    padding: 0 var(--spacing-lg) var(--spacing-lg);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(16, 185, 129, 0.04));
  border-bottom: 1px solid #e5e7eb;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color), rgba(16, 185, 129, 0.8));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
}

.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 4px;
}

.dialog-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.has-references {
  :deep(.el-button__content) {
    svg {
      margin-right: 4px;
    }
  }

  :deep(.el-button) {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
    border-color: rgba(16, 185, 129, 0.25);
    color: #047857;

    &:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
      border-color: rgba(16, 185, 129, 0.35);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
  }
}

.reference-tags {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.mode-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  padding: 4px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;

  button {
    flex: 1;
    padding: 8px 16px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &:hover {
      color: var(--primary-color);
      background: white;
      box-shadow: var(--shadow-sm);
    }

    &.active {
      background: white;
      color: var(--primary-color);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }
  }
}

.selector-content {
  min-height: 400px;
}

.search-bar {
  margin-bottom: var(--spacing-sm);
}

.search-bar :deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb inset;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 0 1px #d1d5db inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px var(--primary-color) inset;
    }
  }
}

.kb-list,
.file-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: var(--spacing-xs);
  background: #f8fafc;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.kb-item,
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }

  &.selected {
    background: #eff6ff;
    border: 1px solid #3b82f6;
  }

  &.has-files {
    border: 1px dashed rgba(16, 185, 129, 0.3);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.02), rgba(16, 185, 129, 0.01));

    &:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(16, 185, 129, 0.02));
    }
  }
}

.kb-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-cover {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);

    svg {
      width: 24px;
      height: 24px;
      color: #64748b;
    }
  }
}

.kb-info,
.file-info {
  flex: 1;
  min-width: 0;
}

.kb-name,
.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-meta,
.file-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.kb-badge {
  padding: 1px 6px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #047857;
  font-weight: 500;
}

.kb-badge-selected {
  padding: 2px 8px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.06));
  border: 1px solid rgba(249, 115, 22, 0.25);
  border-radius: 4px;
  font-size: 11px;
  color: #c2410c;
  font-weight: 500;
}

.file-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.kb-check,
.file-check {
  flex-shrink: 0;
}

.kb-selector {
  margin-bottom: var(--spacing-md);
}

.kb-selector :deep(.el-select) {
  .el-select__wrapper {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb inset;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 0 0 1px #d1d5db inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px var(--primary-color) inset;
    }
  }
}

.file-list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-selection-summary {
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-text {
  font-size: 0.8125rem;
  color: #065f46;
  line-height: 1.5;
}

.summary-text strong {
  font-weight: 600;
  color: #047857;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-top: 1px solid #e5e7eb;
  margin-top: var(--spacing-sm);
}

.selection-summary {
  flex: 1;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.summary-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.summary-text strong {
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 2px;
}

.summary-hint {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-left: 4px;
}

.dialog-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.dialog-actions .el-button {
  min-width: 80px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.cancel-btn {
  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: var(--text-dark);
  }
}

.confirm-btn {
  background: var(--primary-color);
  border-color: var(--primary-color);

  &:hover {
    background: #2c4fcc;
    border-color: #2c4fcc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  &:active {
    transform: translateY(0);
  }
}

:deep(.el-alert) {
  margin-top: var(--spacing-sm);
  border: none;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(59, 130, 246, 0.02));
  border-radius: 10px;
  padding: 12px 16px;

  .el-alert__content {
    padding: 0;
  }

  .el-alert__icon {
    width: 18px;
    height: 18px;
  }
}

:deep(.el-alert__title) {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.8125rem;
  margin-bottom: 4px;
}

:deep(.el-alert__description) {
  color: #3b82f6;
  font-size: 0.75rem;
  line-height: 1.6;
}

:deep(.el-alert--info) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(59, 130, 246, 0.02));
}

:deep(.el-alert--info .el-alert__icon) {
  color: #3b82f6;
}
</style>
