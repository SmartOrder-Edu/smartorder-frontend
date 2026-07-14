<template>
  <AppLayout>
    <div class="cloud-drive-page" @dragenter.prevent="isDragging = true" @dragover.prevent>
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-left">
          <img :src="yunpanLogo" alt="logo" class="main-brand-logo" />
          <div class="header-text">
            <h1 class="page-title">智学云盘</h1>
            <p class="page-desc">您的专属学习资料库，支持多格式文件的高效上传与管理</p>
          </div>
        </div>
        <div class="header-right">
          <div class="compact-storage">
            <span class="storage-text">{{ usedStorage === 0 ? '0' : formatSize(usedStorage) }} / {{
              formatSize(totalStorage) }}</span>
            <el-progress :percentage="storagePercent" :show-text="false" :stroke-width="4"
              :color="storageClass === 'danger' ? '#ef4444' : storageClass === 'warning' ? '#f59e0b' : '#3b5bdb'"
              style="width: 100px; margin-left: 12px;"></el-progress>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 第一行：操作按钮 + 搜索框 -->
        <div class="toolbar-row1">
          <div class="toolbar-left">
            <!-- 批量操作区：未选中时显示上传/新建，选中时显示批量操作 -->
            <transition name="batch-slide" mode="out-in">
              <div v-if="selectedRows.length === 0" class="toolbar-actions" key="default">
                <el-button type="primary" class="btn-upload" @click="showUploadDialog = true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
                    style="margin-right: 4px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  上传文件
                </el-button>
                <el-button class="btn-new-folder" plain @click="handleNewFolder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
                    style="margin-right: 4px;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                  新建文件夹
                </el-button>
              </div>
              <div v-else class="toolbar-actions batch-actions" key="batch">
                <span class="batch-count">已选 {{ selectedRows.length }} 项</span>
                <el-button class="btn-action" plain @click="handleBatchDownload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
                    style="margin-right: 4px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  下载
                </el-button>
                <el-button class="btn-action" plain @click="handleBatchMove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
                    style="margin-right: 4px;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                  移动
                </el-button>
                <el-button class="btn-action btn-action-danger" plain @click="handleBatchDelete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
                    style="margin-right: 4px;">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  删除
                </el-button>
                <el-button class="btn-action" plain @click="selectedRows = []">
                  取消
                </el-button>
              </div>
            </transition>
          </div>
          <div class="toolbar-right">
            <el-input v-model="searchKeyword" placeholder="搜索文件..." :prefix-icon="null" clearable size="large"
              class="search-input">
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 第二行：面包屑 + 文件数量（左）和视图切换（右） -->
        <div class="toolbar-row2">
          <div class="breadcrumb-area">
            <!-- 面包屑 -->
            <div class="breadcrumb">
              <button class="breadcrumb-item" :class="{ active: currentPath.length === 0 }" @click="navigateTo([])">
                全部文件
              </button>
              <template v-for="(segment, idx) in currentPath" :key="idx">
                <span class="breadcrumb-sep">/</span>
                <button class="breadcrumb-item" :class="{ active: idx === currentPath.length - 1 }"
                  @click="navigateTo(currentPath.slice(0, idx + 1))">
                  {{ segment.name }}
                </button>
              </template>
            </div>
            <span class="file-count-badge">{{ displayItems.length }}</span>
          </div>
          <div class="view-toggle">
            <button class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="列表视图">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="网格视图">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-skeleton">
        <div v-for="n in 8" :key="n" class="skeleton-card"></div>
      </div>

      <!-- 文件列表 - 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="file-grid">
        <div v-if="displayItems.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p class="empty-title">暂无文件</p>
          <p class="empty-desc">点击下方按钮或拖拽文件到此处开始使用</p>
          <el-button type="primary" class="btn-upload empty-upload-btn" @click="showUploadDialog = true"
            style="margin-top: 16px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"
              style="margin-right: 4px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            上传文件
          </el-button>
        </div>
        <div v-for="item in displayItems" :key="item.id" class="file-card"
          :class="{ 'is-folder': item.type === 'folder' }" @dblclick="item.type === 'folder' ? enterFolder(item) : handlePreview(item)"
          @contextmenu.prevent="openContextMenu($event, item)">
          <div class="file-card-icon">
            <span v-if="item.type === 'folder'" class="folder-icon-img">
              <img :src="iconFolder" alt="folder" />
            </span>
            <span v-else-if="getFileIcon(item.extension)" class="file-icon-img">
              <img :src="getFileIcon(item.extension)!" :alt="item.extension" />
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
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 文件列表 - 列表视图 -->
      <div v-else-if="!isLoading" class="file-list-container">
        <el-table :data="displayItems" ref="tableRef" style="width: 100%" class="custom-table"
          @row-dblclick="handleRowDblClick" @row-contextmenu="handleRowContextMenu"
          @selection-change="(rows: DriveItem[]) => selectedRows = rows">
          <!-- 多选列 -->
          <el-table-column type="selection" width="50" align="center" />
          <!-- 文件名列 -->
          <el-table-column label="文件名" min-width="160">
            <template #default="{ row }">
              <div class="col-name-cell">
                <span class="row-icon-img" v-if="row.type === 'folder'">
                  <img :src="iconFolder" alt="folder" />
                </span>
                <span v-else-if="getFileIcon(row.extension)" class="row-icon-img">
                  <img :src="getFileIcon(row.extension)!" :alt="row.extension" />
                </span>
                <span v-else class="row-file-type"
                  :style="{ background: getFileBg(row.extension), color: getFileColor(row.extension) }">
                  {{ row.extension }}
                </span>
                <span class="row-name-text">{{ row.name }}</span>
                <el-tag v-if="row.type === 'file' && row.aiStatus" :type="getAiStatusType(row.aiStatus)" size="small"
                  effect="light" style="margin-left: 8px;">
                  {{ getAiStatusText(row.aiStatus) }}
                </el-tag>
                <!-- 行内操作按钮（悬停/选中时显示） -->
                <div class="row-inline-actions" @click.stop>
                  <button class="row-inline-btn btn-preview-highlight" title="预览" @click.stop="handlePreview(row)"
                    v-if="row.type !== 'folder'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    预览
                  </button>
                  <button class="row-inline-btn" title="全局预览" @click.stop="handleOpenInNewWindowDirect(row)"
                    v-if="row.type !== 'folder'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    全局预览
                  </button>
                  <button class="row-inline-btn" title="下载" @click.stop="handleDownload(row)"
                    v-if="row.type !== 'folder'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    下载
                  </button>
                  <button class="row-inline-btn" title="移动" @click.stop="handleMove(row)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                    移动
                  </button>
                  <button class="row-inline-btn" title="重命名" @click.stop="handleRename(row)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                    重命名
                  </button>
                  <button class="row-inline-btn row-inline-btn-more" title="更多"
                    @click.stop="openContextMenu($event, row)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <circle cx="5" cy="12" r="1" />
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 大小列 -->
          <el-table-column label="大小" width="140">
            <template #default="{ row }">
              <span class="row-size-text">{{ row.type === 'folder' ? '-' : formatSize(row.size) }}</span>
            </template>
          </el-table-column>

          <!-- 修改日期列 -->
          <el-table-column label="修改日期" width="180" sortable>
            <template #default="{ row }">
              <span class="row-date-text">{{ formatDate(row.updatedAt) }}</span>
            </template>
          </el-table-column>

          <!-- 空状态 -->
          <template #empty>
            <div class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13,2 13,9 20,9" />
                </svg>
              </div>
              <p class="empty-title">暂无文件</p>
            </div>
          </template>
        </el-table>
      </div>

      <!-- 拖拽上传区域 -->
      <div class="drop-overlay" :class="{ visible: isDragging }" @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
        <div class="drop-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>释放文件以上传</p>
        </div>
      </div>

      <!-- 右键菜单 -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="contextMenu.visible" class="context-menu"
            :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
            <template v-if="contextMenu.item?.type === 'folder'">
              <button class="context-menu-item" @click="enterFolder(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
                打开
              </button>
            </template>
            <template v-else>
              <button class="context-menu-item" @click="handlePreview(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                预览
              </button>
              <button class="context-menu-item" @click="handleOpenInNewWindowDirect(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                新窗口预览
              </button>
              <button class="context-menu-item" @click="handleDownload(contextMenu.item); contextMenu.visible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                下载
              </button>
            </template>
            <button class="context-menu-item" @click="handleRename(contextMenu.item); contextMenu.visible = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              重命名
            </button>
            <button class="context-menu-item" @click="handleMove(contextMenu.item); contextMenu.visible = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <polyline points="9,18 15,12 9,6" />
              </svg>
              移动到
            </button>
            <div class="context-menu-divider"></div>
            <button class="context-menu-item danger"
              @click="handleDelete(contextMenu.item); contextMenu.visible = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              删除
            </button>
          </div>
        </transition>
      </teleport>

      <!-- 上传对话框 -->
      <el-dialog v-model="showUploadDialog" title="上传文件" width="600px" top="20vh" center @closed="onUploadDialogClosed"
        class="upload-dialog-no-border">
        <div class="upload-dialog-desc">
          <div>支持上传 Word、PPT、PDF 等多种格式学习资源</div>
          <div style="margin-top: 6px;">AI 将为您构建专属的个性化智能学习体系</div>
        </div>
        <el-upload ref="uploadRef" class="upload-area-el" drag multiple :auto-upload="false" :show-file-list="false"
          action="#" :on-change="onElUploadChange" :before-upload="handleBeforeUpload"
          :http-request="handleHttpRequest">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="54" height="54"
            style="display: block; margin: 0 auto 12px; color: #a8abb2;">
            <path d="M12 17V3" />
            <path d="M6 9l6-6 6 6" />
            <path d="M5 21h14" stroke-width="2" />
          </svg>
          <div class="el-upload__text" style="font-size: 14px; color: #606266;">拖拽文件到此处，或 <em
              style="color: #409eff; font-style: normal;">点击上传</em></div>
          <template #tip>
            <div class="upload-hint" style="text-align: center; margin-top: 12px; font-size: 12px; color: #909399;">
              单文件不超过 500MB。严禁上传涉密或违规文件。</div>
          </template>
        </el-upload>
        <div v-if="uploadQueue.length > 0" class="upload-queue">
          <div v-for="(file, idx) in uploadQueue" :key="idx" class="upload-queue-item">
            <span class="upload-file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </span>
            <div class="upload-file-info">
              <span class="upload-file-name">{{ file.name }}</span>
              <span class="upload-file-size">{{ formatSize(file.size) }}</span>
            </div>
            <el-progress v-if="file.progress > 0 && file.progress < 100" :percentage="file.progress"
              :format="(p) => p.toFixed(2) + '%'" :stroke-width="6" style="width: 120px;" />
            <span v-else-if="file.progress === 100" class="upload-done">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"
                color="#12b886">
                <polyline points="20,6 9,17 4,12" />
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
      <el-dialog v-model="showNewFolderDialog" title="新建文件夹" width="400px" top="25vh">
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

      <!-- 移动到对话框 -->
      <el-dialog v-model="showMoveDialog" title="选择目标文件夹" width="520px" top="20vh" @opened="onMoveDialogOpened">
        <div class="move-tree-wrapper">
          <div v-if="moveFullTree.length === 0" class="move-empty">没有可移动到的文件夹</div>
          <el-tree v-else :data="moveFullTree" :props="{ label: 'folderName', children: 'children' }"
            node-key="folderId" default-expand-all highlight-current @node-click="handleTreeNodeClick"
            class="move-tree">
            <template #default="{ data }">
              <div class="move-tree-node" :class="{ selected: moveTargetFolderId === String(data.folderId) }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"
                  style="color: #f59e0b; flex-shrink: 0;">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span class="move-tree-label">{{ data.folderName }}</span>
              </div>
            </template>
          </el-tree>
        </div>
        <template #footer>
          <el-button @click="showMoveDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmMove">移动到此处</el-button>
        </template>
      </el-dialog>

      <!-- 文件预览对话框（高保真全屏 iframe 无缝预览） -->
      <el-dialog 
        v-model="showPreviewDialog" 
        width="85vw"
        class="premium-preview-dialog"
        :show-close="false"
        :destroy-on-close="true"
        @closed="previewIframeUrl = ''"
      >
        <div class="iframe-preview-container" v-if="previewIframeUrl">
          <iframe 
            :src="previewIframeUrl" 
            class="preview-iframe-element"
          ></iframe>
          <!-- 浮动在右上角精致的毛玻璃关闭手柄，高自适应感 -->
          <button class="dialog-floating-close-btn" @click="showPreviewDialog = false" title="关闭预览">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </el-dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SparkMD5 from 'spark-md5'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getFolderContent, getFolderTree, createFolder as apiCreateFolder, updateFolder as apiUpdateFolder, deleteFolder as apiDeleteFolder, deleteFile as apiDeleteFile, moveFile as apiMoveFile, moveFolder as apiMoveFolder, batchMoveToFolder, apiInitUpload, apiGetSignUrl, apiUploadChunkToOSS, apiChunkDone, apiMergeChunks, apiCancelUpload, downloadFile } from '@/api/resource'

// 文件类型图标
import iconFolder from '@/assets/folder/folder.png'
import iconPdf from '@/assets/folder/pdf.png'
import iconWord from '@/assets/folder/word.png'
import iconPpt from '@/assets/folder/ppt.png'
import iconExcel from '@/assets/folder/excel.png'
import iconMp4 from '@/assets/folder/file-mp4.png'
import iconMarkdown from '@/assets/folder/markdown.png'
import iconTxt from '@/assets/folder/txt.png'
import yunpanLogo from '@/assets/yunpan/zhixueyunpan.png'

const fileIconMap: Record<string, string> = {
  pdf: iconPdf,
  doc: iconWord, docx: iconWord,
  ppt: iconPpt, pptx: iconPpt,
  xls: iconExcel, xlsx: iconExcel,
  mp4: iconMp4, avi: iconMp4, mov: iconMp4, mkv: iconMp4, wmv: iconMp4,
  md: iconMarkdown,
  txt: iconTxt, log: iconTxt,
}

const getFileIcon = (ext: string): string | null => {
  return fileIconMap[ext?.toLowerCase()] || null
}

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
  aiStatus?: 'pending' | 'processing' | 'completed' | 'failed'
}

// ==================== 状态 ====================
const router = useRouter()
const viewMode = ref<'grid' | 'list'>('list')
const searchKeyword = ref('')
const currentPath = ref<DriveItem[]>([])
const isDragging = ref(false)

const showUploadDialog = ref(false)
const showNewFolderDialog = ref(false)
const showRenameDialog = ref(false)
const showPreviewDialog = ref(false)
const previewIframeUrl = ref('')
const newFolderName = ref('')
const renameValue = ref('')
const renameTarget = ref<DriveItem | null>(null)
const previewFile = ref<DriveItem | null>(null)

// 移动操作
const showMoveDialog = ref(false)
const moveTarget = ref<DriveItem | null>(null)
const moveTargetFolderId = ref('0')
const isBatchMove = ref(false)
const moveFullTree = ref<any[]>([])

// 多选状态
const selectedRows = ref<DriveItem[]>([])
const tableRef = ref()

// 批量操作
const handleBatchDownload = () => {
  const files = selectedRows.value.filter(r => r.type === 'file')
  if (!files.length) { ElMessage.warning('请选择至少一个文件'); return }
  files.forEach(f => handleDownload(f))
}

const handleBatchDelete = async () => {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 个文件/文件夹吗？`, '批量删除', { type: 'warning' })
    for (const item of selectedRows.value) {
      if (item.type === 'folder') {
        const realId = folderIdMap.get(item.id)
        if (realId !== undefined) await apiDeleteFolder(realId)
      } else {
        await apiDeleteFile(item.id)
      }
    }
    selectedRows.value = []
    ElMessage.success('删除成功')
    const parentRealId = currentFolderId.value ? (folderIdMap.get(currentFolderId.value) ?? '0') : '0'
    await loadFolderFromApi(parentRealId)
  } catch { /* cancel */ }
}

const handleBatchMove = () => {
  if (!selectedRows.value.length) return
  isBatchMove.value = true
  moveTarget.value = null
  showMoveDialog.value = true
}

// 上下文菜单
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  item: null as DriveItem | null
})

interface UploadItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'parsing' | 'uploading' | 'paused' | 'success' | 'canceled' | 'exception'
  fileHash: string
  file: File
}
const uploadQueue = ref<UploadItem[]>([])
const uploadControllers = new Map<string, { isPaused: boolean, isCanceled: boolean, resolvePause: any }>()
let uploadCount = 0
let successCount = 0
const uploadRef = ref()
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
      id: f.id,
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
    try {
      if (item.type === 'folder') {
        const folderRealId = folderIdMap.get(item.id)
        if (folderRealId !== undefined) {
          await apiDeleteFolder(folderRealId)
        }
      } else {
        await apiDeleteFile(item.id)
      }

      const parentRealId = currentFolderId.value
        ? (folderIdMap.get(currentFolderId.value) ?? '0')
        : '0'
      await loadFolderFromApi(parentRealId)
      ElMessage.success('已删除')
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => { })
}

// ==================== 移动操作 ====================

const handleMove = (item: DriveItem | null) => {
  if (!item) return
  isBatchMove.value = false
  moveTarget.value = item
  showMoveDialog.value = true
}

/** 递归过滤文件夹树，剔除指定的文件夹及其所有子孙 */
const filterTreeExcludeFolders = (nodes: any[], excludeIds: Set<string>): any[] => {
  return nodes
    .filter(n => !excludeIds.has(String(n.folderId)))
    .map(n => ({
      ...n,
      children: n.children ? filterTreeExcludeFolders(n.children, excludeIds) : []
    }))
}

/** 收集选中文件夹的自身及子孙文件夹ID */
const collectExcludeFolderIds = (): Set<string> => {
  const ids = new Set<string>()
  if (isBatchMove.value) {
    selectedRows.value
      .filter(r => r.type === 'folder')
      .forEach(r => ids.add(String(folderIdMap.get(r.id) ?? r.id)))
  } else if (moveTarget.value?.type === 'folder') {
    ids.add(String(moveTarget.value.id))
  }
  return ids
}

const onMoveDialogOpened = async () => {
  moveTargetFolderId.value = '0'
  try {
    const data = await getFolderTree()
    const excludeIds = collectExcludeFolderIds()
    moveFullTree.value = excludeIds.size > 0
      ? filterTreeExcludeFolders(data.folders || [], excludeIds)
      : (data.folders || [])
  } catch {
    moveFullTree.value = []
  }
}

const handleTreeNodeClick = (data: any) => {
  moveTargetFolderId.value = String(data.folderId)
}

const confirmMove = async () => {
  const targetFolderId = moveTargetFolderId.value
  try {
    if (isBatchMove.value) {
      const folders = selectedRows.value
        .filter(r => r.type === 'folder')
        .map(r => ({ folderId: folderIdMap.get(r.id) ?? r.id }))
        .filter(f => f.folderId)
      const files = selectedRows.value
        .filter(r => r.type === 'file')
        .map(r => ({ id: r.id }))
      if (!folders.length && !files.length) {
        ElMessage.warning('没有可移动的项目')
        return
      }
      await batchMoveToFolder({ folderId: targetFolderId, folders, files })
      selectedRows.value = []
    } else {
      if (!moveTarget.value) return
      if (moveTarget.value.type === 'folder') {
        const folderRealId = folderIdMap.get(moveTarget.value.id)
        if (folderRealId !== undefined) {
          await apiMoveFolder(folderRealId, targetFolderId)
        }
      } else {
        await apiMoveFile(moveTarget.value.id, targetFolderId)
      }
    }
    showMoveDialog.value = false
    ElMessage.success('移动成功')
    const parentRealId = currentFolderId.value
      ? (folderIdMap.get(currentFolderId.value) ?? '0')
      : '0'
    await loadFolderFromApi(parentRealId)
  } catch {
    ElMessage.error('移动失败')
  }
}

const handleDownload = (item: DriveItem | null) => {
  if (!item || item.type !== 'file') return
  console.log('handleDownload item:', item)
  ElMessage.success(`正在下载: ${item.name}`)
  downloadFile(item.id, item.name)
}

const handlePreview = (item: DriveItem | null) => {
  if (!item) return
  previewFile.value = { ...item }
  const routeData = router.resolve({
    name: 'FilePreview',
    query: {
      id: item.id,
      name: item.name,
      size: item.size
    }
  })
  previewIframeUrl.value = routeData.href
  showPreviewDialog.value = true
}

const handleOpenInNewWindow = () => {
  if (!previewFile.value) return
  const file = previewFile.value
  const routeData = router.resolve({
    name: 'FilePreview',
    query: {
      id: file.id,
      name: file.name,
      size: file.size
    }
  })
  window.open(routeData.href, '_blank')
}

const handleOpenInNewWindowDirect = (item: DriveItem | null) => {
  if (!item) return
  const routeData = router.resolve({
    name: 'FilePreview',
    query: {
      id: item.id,
      name: item.name,
      size: item.size
    }
  })
  window.open(routeData.href, '_blank')
}

const onElUploadChange = (file: any) => {
  if (file.raw) {
    // 避免重复添加
    const isExist = uploadQueue.value.some(item => item.file === file.raw)
    if (isExist) return

    uploadQueue.value.push({
      id: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size || 0,
      progress: 0,
      status: 'pending',
      fileHash: '',
      file: file.raw
    })
  }
}

const handleBeforeUpload = (file: File) => {
  const MAX_SIZE = 500 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    ElMessage.error(`文件 "${file.name}" 大小超过了最大值限制(500MB)`)
    // 从界面显示的队列中删除
    uploadQueue.value = uploadQueue.value.filter(item => item.file !== file)
    return false
  }
  return true
}

const checkUploadFinish = () => {
  if (uploadQueue.value.every(i => ['success', 'exception', 'canceled'].includes(i.status))) {
    setTimeout(() => {
      uploadQueue.value = []
      showUploadDialog.value = false
      uploadCount = 0
      successCount = 0
    }, 500)
  }
}

const computeFileMD5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const CHUNK_SIZE = 5 * 1024 * 1024
    const chunksCount = Math.ceil(file.size / CHUNK_SIZE)
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    let currentChunk = 0

    reader.onload = (e) => {
      if (e.target?.result) {
        spark.append(e.target.result as ArrayBuffer)
      }
      currentChunk++
      if (currentChunk < chunksCount) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }
    reader.onerror = () => reject(new Error('文件读取发生错误'))

    function loadNext() {
      const start = currentChunk * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      reader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

const handleHttpRequest = async (options: any) => {
  const { file, onSuccess, onError } = options
  const item = uploadQueue.value.find(i => i.file === file)
  if (!item) return

  item.status = 'uploading'
  uploadCount++

  const controller = { isPaused: false, isCanceled: false, resolvePause: undefined as any }
  uploadControllers.set(item.id, controller)

  try {
    item.status = 'parsing'
    const fileHash = await computeFileMD5(file)
    item.status = 'uploading'
    item.fileHash = fileHash
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // 1. 初始化分片上传
    const initRes = await apiInitUpload({
      fileHash,
      fileName: file.name,
      fileSize: file.size,
      targetFolderId: currentFolderId.value || '0'
    })
    console.log("initRes", initRes);

    const { uploadedChunksParts, fileId, isFinished } = initRes || {}

    // 秒传：文件已存在，直接标记成功
    if (isFinished) {
      item.progress = 100
      item.status = 'success'

      const ext = item.name.split('.').pop()?.toLowerCase() || ''
      const newFile: DriveItem = {
        id: fileId || 'uf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: item.name,
        type: 'file',
        extension: ext,
        size: item.size,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        aiStatus: 'pending'
      }

      if (currentFolderId.value) {
        if (!folderContents.value[currentFolderId.value]) {
          folderContents.value[currentFolderId.value] = []
        }
        folderContents.value[currentFolderId.value].push(newFile)
      } else {
        rootFiles.value.push(newFile)
      }

      onSuccess()
      successCount++
      ElMessage.success(`文件 ${file.name} 秒传成功`)
      checkUploadFinish()
      return
    }

    const chunksArray = uploadedChunksParts || []

    let uploadedSize = chunksArray.length * CHUNK_SIZE
    item.progress = Math.min(100, Math.round((uploadedSize / file.size) * 100))

    // 2. 上传各个分片
    for (let i = 0; i < totalChunks; i++) {
      if (controller.isCanceled) throw new Error('Canceled')

      while (controller.isPaused) {
        item.status = 'paused'
        await new Promise<void>(resolve => { controller.resolvePause = resolve })
        if (controller.isCanceled) throw new Error('Canceled')
        item.status = 'uploading'
      }

      const partNumber = i + 1
      if (chunksArray.includes(partNumber)) {
        continue // 已上传的数据分片，断点续传跳过
      }

      // 截取分片
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      // a) 获取签名 URL
      const signRes = await apiGetSignUrl({ fileHash, partNumber })

      let signedUrl = signRes as unknown as string
      if (typeof signRes === 'string') {
        signedUrl = signRes
      } else if (!signedUrl) {
        signedUrl = (signRes as any).url || null
      }
      console.log('signRes:', signRes, 'signedUrl:', signedUrl)

      if (!signedUrl || signedUrl === 'null') {
        throw new Error('获取签名 URL 失败或返回为 null')
      }

      // b) 上传分片到 OSS
      const eTag = await apiUploadChunkToOSS(signedUrl, chunk)

      // c) 通知分片完成
      await apiChunkDone({ fileHash, chunkNumber: partNumber, eTag })

      // 进度计算
      uploadedSize += chunk.size
      item.progress = Math.min(100, Math.round((uploadedSize / file.size) * 100))
    }

    // 3. 合并请求
    await apiMergeChunks({
      fileHash,
      fileId
    })

    item.progress = 100
    item.status = 'success'

    // 上传完成后的逻辑
    const ext = item.name.split('.').pop()?.toLowerCase() || ''
    const newFile: DriveItem = {
      id: fileId || 'uf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: item.name,
      type: 'file',
      extension: ext,
      size: item.size,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      aiStatus: 'pending'
    }

    if (currentFolderId.value) {
      if (!folderContents.value[currentFolderId.value]) {
        folderContents.value[currentFolderId.value] = []
      }
      folderContents.value[currentFolderId.value].push(newFile)
    } else {
      rootFiles.value.push(newFile)
    }

    onSuccess()
    successCount++
    ElMessage.success(`文件 ${file.name} 上传成功`)
  } catch (e: any) {
    if (e.message === 'Canceled') {
      item.status = 'canceled'
      apiCancelUpload({ fileHash }).catch(() => { })
      return
    }
    item.status = 'exception'
    onError(e)
    ElMessage.error(`文件 ${file.name} 上传失败`)
  } finally {
    checkUploadFinish()
  }
}

const startUpload = () => {
  if (!uploadRef.value || uploadCount > 0) return // avoid multiple submits if already started
  uploadRef.value.submit()
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
      id: Math.random().toString(36).substring(2),
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending',
      fileHash: '',
      file: f
    })
  }
  showUploadDialog.value = true
}

const onUploadDialogClosed = () => {
  uploadQueue.value = []
  uploadCount = 0
  successCount = 0
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 全局点击关闭右键菜单
const onGlobalClick = () => {
  if (contextMenu.visible) {
    contextMenu.visible = false
  }
}

const getAiStatusType = (status?: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const getAiStatusText = (status?: string) => {
  switch (status) {
    case 'completed': return '已解析'
    case 'processing': return '解析中'
    case 'failed': return '解析失败'
    default: return '未解析'
  }
}

const handleRowDblClick = (row: DriveItem) => {
  if (row.type === 'folder') {
    enterFolder(row)
  } else if (row.type === 'file') {
    handlePreview(row)
  }
}

const handleRowContextMenu = (row: DriveItem, column: any, event: MouseEvent) => {
  openContextMenu(event, row)
}

const handlePreviewMessage = (e: MessageEvent) => {
  if (e.data && e.data.type === 'close-preview') {
    showPreviewDialog.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick)
  window.addEventListener('message', handlePreviewMessage)
  loadFolderFromApi('0')
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick)
  window.removeEventListener('message', handlePreviewMessage)
})
</script>

<style scoped>
.cloud-drive-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 24px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

/* 现代简约滚动条 */
.cloud-drive-page::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.cloud-drive-page::-webkit-scrollbar-track {
  background: transparent;
}

.cloud-drive-page::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 99px;
}

.cloud-drive-page::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 页面标题区 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-brand-logo {
  height: 88px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(37, 99, 235, 0.12));
  transition: transform 0.3s ease, filter 0.3s ease;
}

.main-brand-logo:hover {
  transform: translateY(-2px) scale(1.02);
  filter: drop-shadow(0 8px 16px rgba(37, 99, 235, 0.18));
}

.header-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  letter-spacing: 0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 头部精简存储指示器 */
.compact-storage {
  display: flex;
  align-items: center;
  background: var(--color-card-bg);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 6px 14px;
  border-radius: 99px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.compact-storage:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(11, 183, 170, 0.08);
  border-color: rgba(11, 183, 170, 0.2);
}

.compact-storage .storage-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  margin-right: 8px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02);
  overflow: hidden;
}

.toolbar-row1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  gap: 16px;
}

.toolbar-row2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 20px 8px;
  border-top: 1px solid #f1f5f9;
}

.breadcrumb-area {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  border-radius: 99px;
  padding: 1px 8px;
  min-width: 22px;
  text-align: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-upload {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transition: all 0.2s ease;
  font-weight: 500;
  border-radius: 8px;
}

.btn-upload:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.btn-new-folder {
  border: 1px solid #e2e8f0;
  color: #475569;
  background-color: #ffffff;
  transition: all 0.2s ease;
  font-weight: 500;
  border-radius: 8px;
}

.btn-new-folder:hover {
  background-color: #f8fafc;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn-action {
  border: 1px solid transparent;
  color: #64748b;
  background-color: transparent;
  transition: all 0.2s ease;
  font-weight: 500;
  border-radius: 8px;
}

.btn-action:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #1e293b;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #e2e8f0;
  margin: 0 16px;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.breadcrumb-item:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.breadcrumb-item.active {
  color: #0f172a;
  font-weight: 600;
}

.breadcrumb-sep {
  color: #cbd5e1;
  font-size: 0.75rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.search-input {
  width: 240px;
  transition: width 0.3s ease;
}

.search-input:focus-within {
  width: 280px;
}

:deep(.search-input .el-input__wrapper) {
  border-radius: 99px;
  background-color: #f1f5f9;
  box-shadow: none !important;
  border: 1px solid transparent;
  padding: 4px 12px;
}

:deep(.search-input .el-input__wrapper.is-focus) {
  border-color: #cbd5e1;
  background-color: #ffffff;
}

.view-toggle {
  display: flex;
  background-color: #f1f5f9;
  border-radius: 99px;
  padding: 2px;
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
  color: #64748b;
  border-radius: 99px;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.toggle-btn:hover:not(.active) {
  color: #0f172a;
}

/* 文件网格 */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.file-card {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(241, 245, 249, 0.8);
  border-radius: 20px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01);
}

.file-card:hover {
  border-color: rgba(219, 234, 254, 0.8);
  box-shadow: 0 24px 48px rgba(37, 99, 235, 0.08), 0 8px 16px rgba(0, 0, 0, 0.03);
  transform: translateY(-6px) scale(1.02);
  background-color: #ffffff;
}

.file-card-icon {
  margin-bottom: 12px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.file-card:hover .file-card-icon {
  transform: scale(1.05);
}

.folder-icon {
  color: #3b82f6;
  /* Modern clean blue folder icon matching Quark */
}

.folder-icon-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.15));
}

.folder-icon-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.file-icon-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.08));
}

.file-icon-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 列表视图图标 */
.row-icon-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.06));
}

.row-icon-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.file-type-icon {
  width: 42px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  border: none;
  position: relative;
  background: currentColor;
  color: white !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06), inset 0 2px 4px rgba(255, 255, 255, 0.4);
}

/* 拟物折角效果 */
.file-type-icon::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom-left-radius: 5px;
  border-top-right-radius: 8px;
  box-shadow: -1px 1px 2px rgba(0, 0, 0, 0.05);
}

.file-ext {
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.file-card-info {
  flex: 1;
  width: 100%;
}

.file-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.file-card-meta {
  font-size: 0.6875rem;
  color: #64748b;
  margin: 0 0 2px;
}

.file-card-date {
  font-size: 0.625rem;
  color: #94a3b8;
  margin: 0;
}

.file-card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.file-card:hover .file-card-actions {
  opacity: 1;
  transform: scale(1);
}

.file-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.file-action-btn:hover {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

/* 列表容器 */
.file-list-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02);
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

.custom-table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #eff6ff;
}

:deep(.el-table) {
  background-color: transparent !important;
}

:deep(.el-table__header) {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.el-table__cell) {
  padding: 14px 0 !important;
  border-bottom: 1px solid #f8fafc !important;
}

:deep(.el-table__header-wrapper) {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.col-name-cell {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

/* 行内操作按钮 - 使用距右边固定距离定位，向右平移并保持紧凑 */
.row-inline-actions {
  position: absolute;
  right: 80px; /* 向右平移，放置在更加精致的位置 */
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}

:deep(.el-table__body tr:hover) .row-inline-actions,
:deep(.el-table__body tr.el-table__row--selected) .row-inline-actions {
  opacity: 1;
  pointer-events: auto;
}

:deep(.el-table__body tr) {
  position: relative;
}

.row-inline-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px; /* 缩小按钮内边距以让按钮间隔更紧凑 */
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.row-inline-btn:hover {
  background: rgba(37, 99, 235, 0.07);
  color: #2563eb;
}

/* 常态下高亮显示的预览按钮（高透天空蓝背景 + 极客蓝文字 + 8px圆角 + 微阴影与微动效） */
.row-inline-btn.btn-preview-highlight {
  background: rgba(37, 99, 235, 0.09) !important;
  color: #2563eb !important;
  font-weight: 500;
  border-radius: 8px;
  padding: 5px 10px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.05);
}

.row-inline-btn.btn-preview-highlight:hover {
  background: rgba(37, 99, 235, 0.18) !important;
  color: #1d4ed8 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.16);
}

.row-inline-btn-more {
  padding: 5px 6px;
}

/* 批量操作动画 */
.batch-slide-enter-active,
.batch-slide-leave-active {
  transition: all 0.2s ease;
}

.batch-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.batch-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  padding: 0 4px;
  white-space: nowrap;
}

.btn-action-danger {
  color: #ef4444 !important;
  border-color: #fecaca !important;
}

.btn-action-danger:hover {
  background: #fef2f2 !important;
  border-color: #f87171 !important;
}

.table-actions-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

:deep(.el-table__body tr:hover) .table-actions-center {
  opacity: 1;
}

/* 操作列无表头 */
:deep(.actions-col .cell) {
  padding: 0 !important;
}

.row-icon {
  color: #3b82f6;
  /* Modern Blue Folder Icon */
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.row-icon-img {
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.15));
}

.row-file-type {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 800;
  text-transform: uppercase;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
}

.row-name-text {
  font-size: 0.875rem;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.row-size-text,
.row-type-text {
  font-size: 0.8125rem;
  color: #475569;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  background: #f1f5f9;
  padding: 24px;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
  display: inline-flex;
  margin-bottom: 20px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.empty-state:hover .empty-icon {
  transform: scale(1.05) rotate(-3deg);
  background: #eff6ff;
  color: #3b82f6;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 6px;
}

.empty-desc {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
}

/* 拖拽覆盖层 */
.drop-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(37, 99, 235, 0.04);
  backdrop-filter: blur(6px);
  z-index: 500;
  align-items: center;
  justify-content: center;
  border: 2px dashed #2563eb;
  margin: 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.drop-overlay.visible {
  display: flex;
}

.drop-content {
  text-align: center;
  color: #2563eb;
}

.drop-content svg {
  margin-bottom: 12px;
}

.drop-content p {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 150px;
  background: var(--color-card-bg);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 4px;
  backdrop-filter: blur(10px);
}

.context-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 0.8125rem;
  color: #334155;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.context-menu-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.context-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Element Plus 弹窗深度美化与毛玻璃 */
:deep(.el-dialog) {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15) !important;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.96) !important;
  backdrop-filter: blur(16px);
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: #0f172a;
  font-size: 1.1rem;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #64748b;
  transition: color 0.2s;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #0f172a;
}

/* 上传拖拽区域美化 */
:deep(.upload-area-el .el-upload-dragger) {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 40px 24px;
}

:deep(.upload-area-el .el-upload-dragger:hover),
:deep(.upload-area-el .el-upload-dragger.is-dragover) {
  border-color: #2563eb;
  background: #eff6ff;
  transform: scale(1.01);
}

.upload-queue {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.upload-queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.upload-file-icon {
  color: #64748b;
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
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.upload-file-size {
  font-size: 0.6875rem;
  color: #64748b;
}

.upload-done {
  color: #10b981;
}

.upload-pending {
  font-size: 0.75rem;
  color: #64748b;
}

/* 移动对话框 - 树形选择 */
.move-tree-wrapper {
  max-height: 360px;
  overflow-y: auto;
}

.move-tree {
  --el-tree-node-hover-bg-color: #f1f5f9;
}

:deep(.move-tree .el-tree-node__content) {
  height: 38px;
  border-radius: 6px;
  padding: 0 4px;
}

:deep(.move-tree .el-tree-node__content:hover) {
  background-color: #f1f5f9;
}

.move-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.move-tree-node.selected {
  background: #eff6ff;
}

.move-tree-label {
  font-size: 0.8125rem;
  color: #1e293b;
}

.move-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
}

/* 高保真全屏 iframe 预览 Dialog 样式 */
:deep(.premium-preview-dialog) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  margin-top: 6vh !important;
  
  .el-dialog__header {
    display: none !important;
  }
  
  .el-dialog__body {
    padding: 0 !important;
    background: transparent !important;
  }
}

.iframe-preview-container {
  position: relative;
  width: 100%;
  height: 84vh;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.preview-iframe-element {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
}

/* 浮层磨砂质感关闭按钮 */
.dialog-floating-close-btn {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-floating-close-btn:hover {
  background: rgba(239, 68, 68, 0.85);
  border-color: #ef4444;
  color: #fff;
  transform: rotate(90deg);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

:deep(.el-dialog__header),
:deep(.el-dialog__footer),
:deep(.el-dialog__header.is-center) {
  border-bottom: none !important;
  border-top: none !important;
  box-shadow: none !important;
}

:deep(.el-dialog__header::after),
:deep(.el-dialog__header::before) {
  display: none !important;
}

:deep(.el-dialog__body) {
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.el-dialog) {
  border: none !important;
}

/* 加载骨架屏 */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.skeleton-card {
  height: 140px;
  background: linear-gradient(110deg, #f1f5f9 30%, #e2e8f0 50%, #f1f5f9 70%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 16px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* 上传对话框描述 */
.upload-dialog-desc {
  margin-bottom: 20px;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
  line-height: 1.6;
}

/* 列表日期文字 */
.row-date-text {
  font-size: 0.8125rem;
  color: #64748b;
}

/* 空状态上传按钮 */
.empty-upload-btn {
  border-radius: 99px !important;
  padding: 10px 28px !important;
  font-size: 0.875rem;
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
