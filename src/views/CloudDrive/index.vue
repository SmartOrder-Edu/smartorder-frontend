<template>
  <AppLayout>
    <div class="cloud-drive-page">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">个人云盘</h1>
          <p class="page-desc">你的私有文件存储空间，支持上传、下载、预览学习资料</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showUploadDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            上传文件
          </el-button>
          <el-button @click="handleNewFolder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            新建文件夹
          </el-button>
        </div>
      </div>

      <!-- 存储空间 -->
      <div class="storage-bar">
        <div class="storage-info">
          <div class="storage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="storage-text">
            <span class="storage-label">已使用 <strong>{{ formatSize(usedStorage) }}</strong> / 共 {{ formatSize(totalStorage) }}</span>
            <span class="storage-percent">{{ storagePercent }}%</span>
          </div>
        </div>
        <div class="storage-progress">
          <div class="storage-progress-fill" :style="{ width: storagePercent + '%' }" :class="storageClass"></div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <!-- 面包屑 -->
          <div class="breadcrumb">
            <button
              class="breadcrumb-item"
              :class="{ active: currentPath.length === 0 }"
              @click="navigateTo([])"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              全部文件
            </button>
            <template v-for="(segment, idx) in currentPath" :key="idx">
              <span class="breadcrumb-sep">/</span>
              <button
                class="breadcrumb-item"
                :class="{ active: idx === currentPath.length - 1 }"
                @click="navigateTo(currentPath.slice(0, idx + 1))"
              >
                {{ segment.name }}
              </button>
            </template>
          </div>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文件..."
            :prefix-icon="null"
            clearable
            class="search-input"
          >
            <template #prefix>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </template>
          </el-input>
          <div class="view-toggle">
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="网格视图"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="列表视图"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 文件列表 - 网格视图 -->
      <div v-if="viewMode === 'grid'" class="file-grid">
        <div v-if="displayItems.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13,2 13,9 20,9"/>
            </svg>
          </div>
          <p class="empty-title">暂无文件</p>
          <p class="empty-desc">点击"上传文件"或拖拽文件到此处开始使用</p>
        </div>
        <div
          v-for="item in displayItems"
          :key="item.id"
          class="file-card"
          :class="{ 'is-folder': item.type === 'folder' }"
          @dblclick="item.type === 'folder' && enterFolder(item)"
          @contextmenu.prevent="openContextMenu($event, item)"
        >
          <div class="file-card-icon">
            <span v-if="item.type === 'folder'" class="folder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span v-else class="file-type-icon" :style="{ color: getFileColor(item.extension) }">
              <span class="file-ext">{{ item.extension }}</span>
            </span>
          </div>
          <div class="file-card-info">
            <p class="file-card-name" :title="item.name">{{ item.name }}</p>
            <p class="file-card-meta" v-if="item.type !== 'folder'">{{ formatSize(item.size) }}</p>
            <p class="file-card-meta" v-else>{{ item.fileCount }} 个项目</p>
            <p class="file-card-date">{{ formatDate(item.updatedAt) }}</p>
          </div>
          <div class="file-card-actions" @click.stop>
            <button class="file-action-btn" title="更多操作" @click="openContextMenu($event, item)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 文件列表 - 列表视图 -->
      <div v-else class="file-list">
        <div class="file-list-header">
          <span class="col-name">文件名</span>
          <span class="col-size">大小</span>
          <span class="col-date">修改日期</span>
          <span class="col-actions"></span>
        </div>
        <div v-if="displayItems.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13,2 13,9 20,9"/>
            </svg>
          </div>
          <p class="empty-title">暂无文件</p>
        </div>
        <div
          v-for="item in displayItems"
          :key="item.id"
          class="file-list-row"
          :class="{ 'is-folder': item.type === 'folder' }"
          @dblclick="item.type === 'folder' && enterFolder(item)"
          @contextmenu.prevent="openContextMenu($event, item)"
        >
          <span class="col-name">
            <span class="row-icon" v-if="item.type === 'folder'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span v-else class="row-file-type" :style="{ background: getFileBg(item.extension), color: getFileColor(item.extension) }">
              {{ item.extension }}
            </span>
            <span class="row-name-text">{{ item.name }}</span>
          </span>
          <span class="col-size">{{ item.type === 'folder' ? '--' : formatSize(item.size) }}</span>
          <span class="col-date">{{ formatDate(item.updatedAt) }}</span>
          <span class="col-actions" @click.stop>
            <button class="file-action-btn" title="下载" @click="handleDownload(item)" v-if="item.type !== 'folder'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button class="file-action-btn" title="更多操作" @click="openContextMenu($event, item)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </span>
        </div>
      </div>

      <!-- 拖拽上传区域 -->
      <div
        class="drop-overlay"
        :class="{ visible: isDragging }"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div class="drop-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>释放文件以上传</p>
        </div>
      </div>

      <!-- 右键菜单 -->
      <teleport to="body">
        <transition name="fade">
          <div
            v-if="contextMenu.visible"
            class="context-menu"
            :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
          >
            <template v-if="contextMenu.item?.type === 'folder'">
              <button class="context-menu-item" @click="enterFolder(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
                打开
              </button>
            </template>
            <template v-else>
              <button class="context-menu-item" @click="handlePreview(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                预览
              </button>
              <button class="context-menu-item" @click="handleDownload(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                下载
              </button>
            </template>
            <button class="context-menu-item" @click="handleRename(contextMenu.item); contextMenu.visible = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              重命名
            </button>
            <div class="context-menu-divider"></div>
            <button class="context-menu-item danger" @click="handleDelete(contextMenu.item); contextMenu.visible = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </transition>
      </teleport>

      <!-- 上传对话框 -->
      <el-dialog v-model="showUploadDialog" title="上传文件" width="500px" :close-on-click-modal="false">
        <div class="upload-area" @click="triggerUpload">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="onFileSelected"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>点击选择文件或拖拽到此处</p>
          <span class="upload-hint">支持所有文件类型，单文件最大 100MB</span>
        </div>
        <div v-if="uploadQueue.length > 0" class="upload-queue">
          <div v-for="(file, idx) in uploadQueue" :key="idx" class="upload-queue-item">
            <span class="upload-file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </span>
            <div class="upload-file-info">
              <span class="upload-file-name">{{ file.name }}</span>
              <span class="upload-file-size">{{ formatSize(file.size) }}</span>
            </div>
            <el-progress v-if="file.progress > 0 && file.progress < 100" :percentage="file.progress" :stroke-width="6" style="width: 120px;" />
            <span v-else-if="file.progress === 100" class="upload-done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" color="#12b886">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </span>
            <span v-else class="upload-pending">等待上传</span>
          </div>
        </div>
        <template #footer>
          <el-button @click="showUploadDialog = false">取消</el-button>
          <el-button type="primary" :disabled="uploadQueue.length === 0" @click="startUpload">
            开始上传
          </el-button>
        </template>
      </el-dialog>

      <!-- 新建文件夹对话框 -->
      <el-dialog v-model="showNewFolderDialog" title="新建文件夹" width="400px">
        <el-input v-model="newFolderName" placeholder="请输入文件夹名称" @keyup.enter="confirmNewFolder" />
        <template #footer>
          <el-button @click="showNewFolderDialog = false">取消</el-button>
          <el-button type="primary" :disabled="!newFolderName.trim()" @click="confirmNewFolder">确定</el-button>
        </template>
      </el-dialog>

      <!-- 重命名对话框 -->
      <el-dialog v-model="showRenameDialog" title="重命名" width="400px">
        <el-input v-model="renameValue" placeholder="请输入新名称" @keyup.enter="confirmRename" />
        <template #footer>
          <el-button @click="showRenameDialog = false">取消</el-button>
          <el-button type="primary" :disabled="!renameValue.trim()" @click="confirmRename">确定</el-button>
        </template>
      </el-dialog>

      <!-- 文件预览对话框 -->
      <el-dialog v-model="showPreviewDialog" :title="previewFile?.name" width="700px">
        <div class="preview-body" v-if="previewFile">
          <div v-if="isPreviewableImage(previewFile.extension)" class="preview-image">
            <img :src="previewFile.thumbnail" :alt="previewFile.name" />
          </div>
          <div v-else-if="isPreviewableText(previewFile.extension)" class="preview-text">
            <pre>{{ previewFile.thumbnail }}</pre>
          </div>
          <div v-else class="preview-unsupported">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <p>暂不支持预览此文件类型</p>
            <el-button @click="handleDownload(previewFile)">下载文件</el-button>
          </div>
        </div>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getFolderContent, createFolder as apiCreateFolder, updateFolder as apiUpdateFolder, deleteFolder as apiDeleteFolder } from '@/api/resource'

// ==================== 类型定义 ====================
interface DriveItem {
  id: string
  name: string
  type: 'file' | 'folder'
  extension: string
  size: number
  createdAt: string
  updatedAt: string
  thumbnail?: string
  fileCount?: number
}

// ==================== 状态 ====================
const viewMode = ref<'grid' | 'list'>('grid')
const searchKeyword = ref('')
const currentPath = ref<DriveItem[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const showUploadDialog = ref(false)
const showNewFolderDialog = ref(false)
const showRenameDialog = ref(false)
const showPreviewDialog = ref(false)
const newFolderName = ref('')
const renameValue = ref('')
const renameTarget = ref<DriveItem | null>(null)
const previewFile = ref<DriveItem | null>(null)

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  item: null as DriveItem | null
})

interface UploadItem {
  name: string
  size: number
  progress: number
  file: File
}
const uploadQueue = ref<UploadItem[]>([])
const isLoading = ref(false)
const folderIdMap = new Map<string, string>()

const totalStorage = 10 * 1024 * 1024 * 1024 // 10GB

// ==================== 数据 ====================
const rootFiles = ref<DriveItem[]>([])
const folderContents = ref<Record<string, DriveItem[]>>({})

// ==================== 计算属性 ====================
const currentFolderId = computed(() => {
  if (currentPath.value.length === 0) return null
  return currentPath.value[currentPath.value.length - 1].id
})

const currentFiles = computed(() => {
  const fid = currentFolderId.value
  if (!fid) return rootFiles.value
  return folderContents.value[fid] || []
})

const displayItems = computed(() => {
  let items = currentFiles.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(kw)
    )
  }
  // 文件夹在前，按名称排序
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
})

const usedStorage = computed(() => {
  const calcSize = (items: DriveItem[]): number => {
    let total = 0
    for (const item of items) {
      if (item.type === 'file') {
        total += item.size
      } else {
        const children = folderContents.value[item.id]
        if (children) total += calcSize(children)
      }
    }
    return total
  }
  return calcSize(rootFiles.value)
})

const storagePercent = computed(() => {
  return Math.round((usedStorage.value / totalStorage) * 100)
})

const storageClass = computed(() => {
  if (storagePercent.value > 90) return 'danger'
  if (storagePercent.value > 70) return 'warning'
  return ''
})

// ==================== 方法 ====================
const loadFolderFromApi = async (parentId: string) => {
  isLoading.value = true
  try {
    const data = await getFolderContent(parentId)
    console.log('loadFolderFromApi response:', data)
    const folders: DriveItem[] = data.folders.map(f => {
      folderIdMap.set(f.folderId, f.folderId)
      return {
        id: f.folderId,
        name: f.folderName,
        type: 'folder' as const,
        extension: '',
        size: 0,
        createdAt: f.updateTime,
        updatedAt: f.updateTime,
        fileCount: 0
      }
    })
    const files: DriveItem[] = data.files.map(f => ({
      id: f.fileId,
      name: f.fileName,
      type: 'file' as const,
      extension: f.fileType || f.fileName.split('.').pop()?.toLowerCase() || '',
      size: f.fileSize,
      createdAt: f.updateTime,
      updatedAt: f.updateTime
    }))
    if (parentId === '0') {
      rootFiles.value = [...folders, ...files]
    } else {
      folderContents.value[data.folderId] = [...folders, ...files]
    }
  } catch (err) {
    console.error('loadFolderFromApi failed:', err)
  } finally {
    isLoading.value = false
  }
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '--'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const dayMs = 86400000
  if (diff < dayMs) return '今天'
  if (diff < 2 * dayMs) return '昨天'
  if (diff < 7 * dayMs) return Math.floor(diff / dayMs) + '天前'
  return dateStr
}

const getFileColor = (ext: string): string => {
  const colors: Record<string, string> = {
    pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6',
    ppt: '#f97316', pptx: '#f97316', xls: '#22c55e', xlsx: '#22c55e',
    png: '#a855f7', jpg: '#a855f7', jpeg: '#a855f7', gif: '#a855f7',
    mp4: '#06b6d4', avi: '#06b6d4', mov: '#06b6d4',
    mp3: '#f59e0b', wav: '#f59e0b',
    md: '#6366f1', txt: '#6b7280', zip: '#8b5cf6', rar: '#8b5cf6'
  }
  return colors[ext] || '#6b7280'
}

const getFileBg = (ext: string): string => {
  const color = getFileColor(ext)
  return color + '15'
}

const isPreviewableImage = (ext: string): boolean => {
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)
}

const isPreviewableText = (ext: string): boolean => {
  return ['md', 'txt', 'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'py', 'java'].includes(ext)
}

const navigateTo = (path: DriveItem[]) => {
  currentPath.value = path
  searchKeyword.value = ''
}

const enterFolder = (item: DriveItem) => {
  if (item.type !== 'folder') return
  currentPath.value = [...currentPath.value, item]
  searchKeyword.value = ''
  const folderRealId = folderIdMap.get(item.id)
  console.log('enterFolder:', item.id, '→ folderRealId:', folderRealId, 'mapSize:', folderIdMap.size)
  if (folderRealId !== undefined) {
    loadFolderFromApi(folderRealId)
  }
}

const openContextMenu = (e: MouseEvent, item: DriveItem) => {
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.item = item
}

const closeContextMenu = () => {
  contextMenu.visible = false
  contextMenu.item = null
}

const handleNewFolder = () => {
  newFolderName.value = ''
  showNewFolderDialog.value = true
}

const confirmNewFolder = async () => {
  const name = newFolderName.value.trim()
  if (!name) return
  const parentRealId = currentFolderId.value
    ? (folderIdMap.get(currentFolderId.value) ?? '0')
    : '0'
  try {
    await apiCreateFolder({ folderName: name, parentId: parentRealId })
    showNewFolderDialog.value = false
    ElMessage.success('文件夹已创建')
    await loadFolderFromApi(parentRealId)
  } catch {
    // API 报错由 request 拦截器处理
  }
}

const handleRename = (item: DriveItem | null) => {
  if (!item) return
  renameTarget.value = item
  renameValue.value = item.name
  showRenameDialog.value = true
}

const confirmRename = async () => {
  if (!renameTarget.value || !renameValue.value.trim()) return
  const item = renameTarget.value
  const newName = renameValue.value.trim()
  if (item.type === 'folder') {
    const folderRealId = folderIdMap.get(item.id)
    if (folderRealId !== undefined) {
      try {
        await apiUpdateFolder(folderRealId, newName)
        showRenameDialog.value = false
        ElMessage.success('重命名成功')
        const parentRealId = currentFolderId.value
          ? (folderIdMap.get(currentFolderId.value) ?? '0')
          : '0'
        await loadFolderFromApi(parentRealId)
      } catch {
        // API 报错由 request 拦截器处理
      }
      return
    }
  }
  // 文件暂不支持重命名
  item.name = newName
  item.updatedAt = new Date().toISOString().split('T')[0]
  showRenameDialog.value = false
  ElMessage.success('重命名成功')
}

const handleDelete = (item: DriveItem | null) => {
  if (!item) return
  ElMessageBox.confirm(`确定要删除"${item.name}"吗？此操作不可撤销。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    if (item.type === 'folder') {
      const folderRealId = folderIdMap.get(item.id)
      if (folderRealId !== undefined) {
        try {
          await apiDeleteFolder(folderRealId)
        } catch {
          return
        }
      }
    }
    const parentRealId = currentFolderId.value
      ? (folderIdMap.get(currentFolderId.value) ?? '0')
      : '0'
    await loadFolderFromApi(parentRealId)
    ElMessage.success('已删除')
  }).catch(() => {})
}

const handleDownload = (item: DriveItem | null) => {
  if (!item) return
  ElMessage.success(`正在准备下载: ${item.name}`)
}

const handlePreview = (item: DriveItem | null) => {
  if (!item) return
  previewFile.value = { ...item }
  if (isPreviewableImage(item.extension) || isPreviewableText(item.extension)) {
    previewFile.value.thumbnail = item.thumbnail || '预览内容暂不可用'
  }
  showPreviewDialog.value = true
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  for (let i = 0; i < input.files.length; i++) {
    const f = input.files[i]
    uploadQueue.value.push({
      name: f.name,
      size: f.size,
      progress: 0,
      file: f
    })
  }
  input.value = ''
}

const startUpload = () => {
  uploadQueue.value.forEach((item, idx) => {
    // 模拟上传进度
    const interval = setInterval(() => {
      if (item.progress >= 100) {
        clearInterval(interval)
        // 上传完成，添加到当前目录
        const ext = item.name.split('.').pop()?.toLowerCase() || ''
        const newFile: DriveItem = {
          id: 'uf_' + Date.now() + '_' + idx,
          name: item.name,
          type: 'file',
          extension: ext,
          size: item.size,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        }
        if (currentFolderId.value) {
          const children = folderContents[currentFolderId.value]
          if (children) {
            children.push(newFile)
          } else {
            folderContents[currentFolderId.value] = [newFile]
          }
        } else {
          rootFiles.value.push(newFile)
        }
        return
      }
      item.progress += Math.random() * 30 + 10
      if (item.progress > 100) item.progress = 100
    }, 300)
  })
  setTimeout(() => {
    uploadQueue.value = []
    showUploadDialog.value = false
    ElMessage.success('上传完成')
  }, 2500)
}

const onDragLeave = (e: DragEvent) => {
  // 只在离开 drop-overlay 时取消
  const target = e.currentTarget as HTMLElement
  if (e.relatedTarget && target.contains(e.relatedTarget as Node)) return
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  if (!e.dataTransfer?.files.length) return
  for (let i = 0; i < e.dataTransfer.files.length; i++) {
    const f = e.dataTransfer.files[i]
    uploadQueue.value.push({
      name: f.name,
      size: f.size,
      progress: 0,
      file: f
    })
  }
  showUploadDialog.value = true
}

// 全局点击关闭右键菜单
const onGlobalClick = () => {
  if (contextMenu.visible) {
    contextMenu.visible = false
  }
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick)
  loadFolderFromApi('0')
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
})
</script>

<style scoped>
.cloud-drive-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

/* 页面标题 */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-lg);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.page-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.header-right .el-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 存储空间 */
.storage-bar {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.storage-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.storage-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(59, 91, 219, 0.08);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.storage-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.storage-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.storage-label strong {
  color: var(--text-dark);
}

.storage-percent {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.storage-progress {
  height: 6px;
  background: var(--background-color-base);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.storage-progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

.storage-progress-fill.warning {
  background: #f59e0b;
}

.storage-progress-fill.danger {
  background: #ef4444;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}

.toolbar-left {
  flex: 1;
  min-width: 0;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.breadcrumb-item:hover {
  background: rgba(59, 91, 219, 0.06);
  color: var(--primary-color);
}

.breadcrumb-item.active {
  color: var(--text-dark);
  font-weight: 600;
}

.breadcrumb-sep {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin: 0 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.search-input {
  width: 220px;
}

.view-toggle {
  display: flex;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.toggle-btn.active,
.toggle-btn:hover {
  background: var(--primary-color);
  color: white;
}

/* 文件网格 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.file-card {
  position: relative;
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
}

.file-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(59, 91, 219, 0.1);
  transform: translateY(-2px);
}

.file-card-icon {
  margin-bottom: var(--spacing-sm);
}

.folder-icon {
  color: #f59e0b;
}

.file-type-icon {
  width: 40px;
  height: 48px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid currentColor;
  position: relative;
}

.file-ext {
  position: relative;
  z-index: 1;
}

.file-card-info {
  flex: 1;
  width: 100%;
}

.file-card-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.file-card-meta {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin: 0 0 2px;
}

.file-card-date {
  font-size: 0.625rem;
  color: var(--text-muted);
  margin: 0;
}

.file-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-card:hover .file-card-actions {
  opacity: 1;
}

.file-action-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: white;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.file-action-btn:hover {
  background: rgba(59, 91, 219, 0.06);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

/* 文件列表 */
.file-list {
  background: white;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.file-list-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--background-color-base);
  border-bottom: 1px solid var(--border-light);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.file-list-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.file-list-row:last-child {
  border-bottom: none;
}

.file-list-row:hover {
  background: rgba(59, 91, 219, 0.02);
}

.col-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.col-size {
  width: 100px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-align: right;
  flex-shrink: 0;
}

.col-date {
  width: 100px;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-align: right;
  flex-shrink: 0;
}

.col-actions {
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.file-list-row:hover .col-actions {
  opacity: 1;
}

.row-icon {
  color: #f59e0b;
  flex-shrink: 0;
}

.row-file-type {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.row-name-text {
  font-size: 0.8125rem;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  text-align: center;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  opacity: 0.4;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.empty-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
}

/* 拖拽覆盖层 */
.drop-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(59, 91, 219, 0.08);
  backdrop-filter: blur(4px);
  z-index: 500;
  align-items: center;
  justify-content: center;
  border: 3px dashed var(--primary-color);
  margin: 16px;
  border-radius: var(--radius-xl);
}

.drop-overlay.visible {
  display: flex;
}

.drop-content {
  text-align: center;
  color: var(--primary-color);
}

.drop-content svg {
  margin-bottom: var(--spacing-md);
}

.drop-content p {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-light);
  padding: var(--spacing-xs);
  overflow: hidden;
}

.context-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  font-size: 0.8125rem;
  color: var(--text-regular);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--background-color-base);
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.06);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: var(--spacing-xs) 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 上传对话框 */
.upload-area {
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--text-muted);
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(59, 91, 219, 0.02);
  color: var(--primary-color);
}

.upload-area p {
  margin: var(--spacing-md) 0 var(--spacing-xs);
  font-size: 0.875rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.upload-queue {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.upload-queue-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--background-color-base);
  border-radius: var(--radius-md);
}

.upload-file-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.upload-file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.upload-file-name {
  font-size: 0.8125rem;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-file-size {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.upload-done {
  color: #12b886;
}

.upload-pending {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 预览 */
.preview-body {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: var(--radius-md);
}

.preview-text {
  width: 100%;
  max-height: 400px;
  overflow: auto;
  background: var(--background-color-base);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.preview-text pre {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-unsupported {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.preview-unsupported svg {
  margin-bottom: var(--spacing-md);
  opacity: 0.4;
}

.preview-unsupported p {
  margin: 0 0 var(--spacing-lg);
}

@media (max-width: 768px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }
}
</style>
