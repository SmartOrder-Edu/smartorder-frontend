<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="选择要发布的文件"
    width="640px"
    top="12vh"
    @open="onOpen"
  >
    <div class="picker">
      <!-- 面包屑 + 返回上级 -->
      <div class="picker-bar">
        <div class="breadcrumb">
          <span
            v-for="(crumb, idx) in pathStack"
            :key="crumb.id"
            class="crumb"
            :class="{ active: idx === pathStack.length - 1 }"
            @click="enterFolder(idx)"
          >
            {{ crumb.name }}
            <span v-if="idx < pathStack.length - 1" class="sep">/</span>
          </span>
        </div>
        <el-button
          v-if="pathStack.length > 1"
          text
          size="small"
          @click="goUp"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          返回上级
        </el-button>
      </div>

      <!-- 内容区 -->
      <div class="picker-body" v-loading="loading">
        <div v-if="!loading && folders.length === 0 && files.length === 0" class="picker-empty">
          <p>此文件夹为空</p>
          <p class="empty-hint">请先在云盘上传文件后再发布到广场</p>
        </div>

        <div v-else class="picker-list">
          <!-- 子文件夹 -->
          <div
            v-for="folder in folders"
            :key="folder.folderId"
            class="picker-item folder"
            @dblclick="openFolder(folder)"
            @click="onItemClick('folder', folder, null)"
          >
            <span class="item-icon folder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span class="item-name">{{ folder.folderName }}</span>
            <span class="item-hint">双击进入</span>
          </div>

          <!-- 文件 -->
          <div
            v-for="file in files"
            :key="fileKey(file)"
            class="picker-item file"
            :class="{ selected: selectedId === fileKeyId(file) }"
            @click="onItemClick('file', null, file)"
          >
            <span class="item-icon file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            </span>
            <span class="item-name">{{ file.fileName }}</span>
            <span class="item-meta">{{ formatFileSize(file.fileSize) }}</span>
            <span v-if="selectedId === fileKeyId(file)" class="item-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="!selectedFile" @click="confirm">
        选择此文件
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getFolderContent } from '@/api/resource'
import type { FileFolderVO, FileResourceVO } from '@/types/resource'
import { formatFileSize } from '@/views/Resources/constants'

/** 选中后抛出的文件描述，形状对齐 PublishToSquareDialog.DriveItem */
export interface PickedFile {
  id: string
  name: string
  type: 'file'
  extension: string
  size: number
}

defineProps<{ visible: boolean }>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'select', file: PickedFile): void
}>()

const ROOT_ID = '0'

const loading = ref(false)
const folders = ref<FileFolderVO[]>([])
const files = ref<FileResourceVO[]>([])
const pathStack = ref<{ id: string; name: string; parentId: string | null }[]>([])
const selectedId = ref<string>('')
const selectedFile = ref<FileResourceVO | null>(null)

const onOpen = () => {
  selectedId.value = ''
  selectedFile.value = null
  pathStack.value = [{ id: ROOT_ID, name: '全部文件', parentId: null }]
  loadContent(ROOT_ID)
}

const loadContent = async (folderId: string) => {
  loading.value = true
  try {
    const data = await getFolderContent(folderId)
    folders.value = data.folders || []
    files.value = data.files || []
  } catch {
    // 错误由拦截器处理
  } finally {
    loading.value = false
  }
}

const onItemClick = (kind: 'folder' | 'file', _folder: FileFolderVO | null, file: FileResourceVO | null) => {
  if (kind === 'file' && file) {
    selectedId.value = fileKeyId(file)
    selectedFile.value = file
  } else {
    // 点击文件夹不选中，仅双击进入
    selectedId.value = ''
    selectedFile.value = null
  }
}

const openFolder = (folder: FileFolderVO) => {
  selectedId.value = ''
  selectedFile.value = null
  pathStack.value.push({
    id: folder.folderId,
    name: folder.folderName,
    parentId: folder.folderParentId
  })
  loadContent(folder.folderId)
}

const enterFolder = (idx: number) => {
  if (idx === pathStack.value.length - 1) return
  pathStack.value = pathStack.value.slice(0, idx + 1)
  selectedId.value = ''
  selectedFile.value = null
  loadContent(pathStack.value[idx].id)
}

const goUp = () => {
  if (pathStack.value.length <= 1) return
  pathStack.value.pop()
  selectedId.value = ''
  selectedFile.value = null
  loadContent(pathStack.value[pathStack.value.length - 1].id)
}

/** 兼容后端返回 id / fileId 两种字段名（CloudDrive 实际用 id，类型声明为 fileId） */
const fileKeyId = (f: FileResourceVO): string => (f.fileId ?? (f as any).id) as string
const fileKey = (f: FileResourceVO): string => fileKeyId(f)

const confirm = () => {
  if (!selectedFile.value) return
  const f = selectedFile.value
  emit('select', {
    id: fileKeyId(f),
    name: f.fileName,
    type: 'file',
    extension: f.fileType || f.fileName.split('.').pop()?.toLowerCase() || '',
    size: f.fileSize,
  })
  emit('update:visible', false)
}
</script>

<style scoped>
.picker {
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.picker-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  flex-wrap: wrap;
}

.crumb {
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.crumb:hover { color: var(--primary-color); }

.crumb.active {
  color: var(--text-dark);
  font-weight: 600;
  cursor: default;
}

.crumb .sep { color: var(--text-muted); margin: 0 2px; }

.picker-body {
  flex: 1;
  min-height: 280px;
  max-height: 360px;
  overflow-y: auto;
}

.picker-empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.empty-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border: 1px solid transparent;
}

.picker-item:hover {
  background: var(--background-color-base);
}

.picker-item.file.selected {
  background: rgba(11, 183, 170, 0.08);
  border-color: var(--primary-color);
}

.item-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon svg { width: 20px; height: 20px; }

.folder-icon { color: #f59e0b; }
.file-icon { color: var(--primary-color); }

.item-name {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-hint {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.item-meta {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.item-check {
  color: var(--primary-color);
  display: flex;
  align-items: center;
}

.item-check svg { width: 16px; height: 16px; }
</style>
