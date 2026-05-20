<template>
  <div class="standalone-preview-page" :class="[currentTheme + '-theme']" v-loading="loading" element-loading-text="正在加载在线预览内容...">
    <!-- 顶部极客磨砂工具栏 -->
    <div class="preview-toolbar" v-if="fileName">
      <div class="toolbar-left">
        <span class="file-ext-badge" :style="{ background: getFileBg(fileExt), color: getFileColor(fileExt) }">
          {{ fileExt.toUpperCase() }}
        </span>
        <div class="file-meta-info">
          <h1 class="file-title" :title="fileName">{{ fileName }}</h1>
          <span class="file-size-sub" v-if="fileSize > 0">{{ formatSize(fileSize) }}</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <!-- 💡 旋转动效日夜双态水晶按钮 -->
        <el-button 
          type="default" 
          size="large" 
          class="toolbar-btn theme-toggle-btn" 
          @click="handleToggleTheme"
          :title="currentTheme === 'light' ? '切换至极客夜晚' : '切换至清雅白天'"
        >
          <span class="theme-icon-container" :class="{ 'rotate-active': currentTheme === 'dark' }">
            <!-- ☀️ 太阳 SVG -->
            <svg v-if="currentTheme === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle;">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <!-- 🌙 月牙 SVG -->
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align: middle;">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
          <span style="margin-left: 8px;">{{ currentTheme === 'light' ? '白天模式' : '夜晚模式' }}</span>
        </el-button>

        <!-- 下载按钮 -->
        <el-button type="default" size="large" class="toolbar-btn" @click="handleDownload">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 6px; vertical-align: middle;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          下载到本地
        </el-button>
        <!-- 关闭窗口 -->
        <el-button type="primary" size="large" class="toolbar-btn close-btn" @click="handleClose">
          关闭预览
        </el-button>
      </div>
    </div>

    <!-- 预览内容主体区 -->
    <div class="preview-viewport" v-if="!loading && initialized">
      
      <!-- ==================== 1. 图片预览 (手柄、滚轮缩放、拖拽平移) ==================== -->
      <div 
        v-if="isPreviewableImage(fileExt)" 
        class="standalone-viewport-image"
        @wheel.prevent="handleImgWheel"
        @mousedown="handleImgMouseDown"
        @mousemove="handleImgMouseMove"
        @mouseup="handleImgMouseUp"
        @mouseleave="handleImgMouseUp"
      >
        <div class="image-zoom-container" :style="imageTransformStyle">
          <el-image :src="previewUrl" fit="contain" class="preview-image-img" draggable="false" />
        </div>

        <!-- 图片悬浮高级控制面板 -->
        <div class="image-control-float-bar">
          <div class="img-badge">自适应 ({{ imgScalePercent }}%)</div>
          <div class="control-divider"></div>
          <button class="float-btn" @click="adjustImgScale(0.1)" title="放大">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button class="float-btn" @click="adjustImgScale(-0.1)" title="缩小">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <button class="float-btn" @click="rotateImg" title="旋转 90°">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          </button>
          <button class="float-btn" @click="resetImg" title="重置 1:1">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
          </button>
          <button class="float-btn" @click="toggleImgFullscreen" title="全屏查看">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </button>
        </div>
      </div>

      <!-- ==================== 2. PDF预览 (高保真卡片框、高科技骨架加载) ==================== -->
      <div v-else-if="isPreviewablePdf(fileExt)" class="standalone-viewport-pdf">
        <div class="pdf-skeleton-wrapper" v-if="pdfLoading">
          <div class="tech-skeleton-card">
            <div class="skeleton-shimmer-bar"></div>
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line width-60"></div>
            <div class="skeleton-line width-80"></div>
            <div class="skeleton-line width-40"></div>
            <div class="skeleton-pulse-text">🔐 智学 PDF 解析容器载入中...</div>
          </div>
        </div>
        <div class="pdf-card-frame" :class="{ 'ready': !pdfLoading }">
          <iframe :src="previewUrl" :key="previewUrl" class="preview-pdf-iframe" @load="pdfLoading = false"></iframe>
        </div>
      </div>

      <!-- ==================== 3. Excel 表格预览 (模糊搜索过滤高亮、多维看板) ==================== -->
      <div v-else-if="isPreviewableExcel(fileExt)" class="standalone-viewport-excel">
        <div class="excel-analysis-bar">
          <div class="analysis-left">
            <span class="excel-status-dot"></span>
            <span class="analysis-title">📊 多维网格流式分析引擎已就绪</span>
            <span class="analysis-tag">总行数: {{ excelSheets[activeExcelSheet]?.rows.length || 0 }} 行</span>
            <span class="analysis-tag">总列数: {{ excelSheets[activeExcelSheet]?.headers.length || 0 }} 列</span>
            <span class="analysis-tag search-match-tag" v-if="excelSearchQuery">已匹配: {{ filteredExcelRows.length }} 行</span>
          </div>
          <div class="analysis-right">
            <el-input 
              v-model="excelSearchQuery" 
              placeholder="🔍 实时模糊搜索过滤..." 
              clearable 
              size="default" 
              class="excel-search-input"
            />
          </div>
        </div>

        <el-tabs v-model="activeExcelSheet" class="excel-sheets-tabs" type="card">
          <el-tab-pane 
            v-for="(sheet, index) in excelSheets" 
            :key="index" 
            :label="sheet.name" 
            :name="index"
          >
            <el-table 
              :data="filteredExcelRows" 
              border 
              stripe 
              highlight-current-row
              height="calc(100vh - 220px)" 
              class="excel-table-data"
            >
              <el-table-column 
                type="index" 
                label="序号" 
                width="60" 
                align="center" 
                fixed
              />
              <el-table-column
                v-for="(header, hIdx) in sheet.headers"
                :key="hIdx"
                :prop="header || `COLUMN_${hIdx + 1}`"
                :label="header || `列 ${hIdx + 1}`"
                :min-width="sheet.colWidths[hIdx]"
                show-overflow-tooltip
              >
                <template #default="scope">
                  <span v-html="highlightExcelText(scope.row[header || `COLUMN_${hIdx + 1}`])"></span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        
        <div class="excel-tech-hint">
          <span class="excel-hint-pulse"></span>
          <span class="excel-hint-text">📊 <b>数据加载完成：</b>Excel 表格多维数据已流式解析成功。已为您自动锁首行并启用多维过滤。</span>
        </div>
      </div>

      <!-- ==================== 4. Word 预览 (仿 3D 纸张卡片、缩放控制、宽窄屏双态) ==================== -->
      <div v-else-if="isPreviewableWord(fileExt)" class="standalone-viewport-docx">
        <div class="docx-controls-panel">
          <div class="panel-section">
            <span class="section-label">页面宽度：</span>
            <el-radio-group v-model="docxWideMode" size="small">
              <el-radio-button :label="false">标准护眼</el-radio-button>
              <el-radio-button :label="true">极客宽屏</el-radio-button>
            </el-radio-group>
          </div>
          <div class="panel-divider"></div>
          <div class="panel-section">
            <span class="section-label">字号缩放：</span>
            <el-button-group>
              <el-button size="small" @click="adjustDocxZoom(-10)" :disabled="docxZoom <= 60">A -</el-button>
              <el-button size="small" disabled class="zoom-value">{{ docxZoom }}%</el-button>
              <el-button size="small" @click="adjustDocxZoom(10)" :disabled="docxZoom >= 160">A +</el-button>
            </el-button-group>
          </div>
        </div>

        <div class="docx-a4-wrapper" :style="{ maxWidth: docxWideMode ? '1200px' : '850px', fontSize: docxZoom + '%' }">
          <div ref="docxContainerRef" class="docx-a4-page"></div>
        </div>
      </div>

      <!-- ==================== 5. PPT 预览 (极光磨砂玻璃 Fallback) ==================== -->
      <div v-else-if="isPreviewablePpt(fileExt)" class="standalone-viewport-ppt">
        <iframe v-if="!isLocalhostEnv" :src="previewUrl" class="preview-ppt-iframe"></iframe>
        
        <div v-else class="localhost-ppt-fallback">
          <div class="glass-container aurora-glowing-card">
            <div class="ppt-mock-cover">
              <div class="ppt-mock-icon-glow">
                <img :src="iconPpt" alt="PPT Icon" class="bounce-icon-3d" />
              </div>
              <div class="ppt-mock-meta">
                <h4 class="ppt-fallback-title">{{ fileName }}</h4>
                <p class="file-size-badge" v-if="fileSize > 0">{{ formatSize(fileSize) }}</p>
              </div>
            </div>
            
            <div class="fallback-tips">
              <div class="alert-badge-glow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="margin-right: 6px;">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                本地开发限制提示
              </div>
              <p class="tips-desc">
                当前处于本地局域网或开发环境，微软 Office 在线预览服务无法直接读取您本地机的文件。
              </p>
              <div class="crystal-btn-container">
                <button class="crystal-download-btn" @click="handleDownload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18" style="margin-right: 8px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  立即下载到本地打开
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 6. Markdown 预览 (TOC树、双态视图、Mac代码块) ==================== -->
      <div v-else-if="isPreviewableMarkdown(fileExt)" class="standalone-viewport-markdown-container">
        <!-- 语雀级精致头部面包屑与操作栏 -->
        <div class="markdown-control-bar">
          <div class="md-bar-left">
            <span class="md-book-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span class="md-breadcrumb-item">SmartOrder Edu 知序智学-文档</span>
            <span class="md-breadcrumb-separator">/</span>
            <span class="md-breadcrumb-current">{{ fileName }}</span>
            <span class="md-status-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" class="cloud-success-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              已加载最新版本
            </span>
          </div>
          <div class="md-bar-right">
            <!-- 语雀式 mock 动作 -->
            <button class="md-bar-action-btn" title="星标收藏">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polyline></svg>
            </button>
            <button class="md-bar-action-btn" title="演示模式">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            </button>
            <button class="md-bar-action-btn" @click="handleDownload" title="导出文件">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button class="md-bar-action-btn" title="显示大纲" @click="showToc = true" v-if="!showToc && markdownToc.length > 0">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <span class="md-action-divider" v-if="!showToc && markdownToc.length > 0"></span>
            
            <el-radio-group v-model="mdSourceMode" size="small" class="md-source-toggle">
              <el-radio-button :label="false">✨ 渲染视图</el-radio-button>
              <el-radio-button :label="true">💻 源码视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="markdown-layout-wrapper">
          <div class="markdown-raw-editor" v-if="mdSourceMode">
            <div class="editor-line-numbers">
              <span v-for="n in previewMarkdownSource.split('\n').length" :key="n" class="line-number">{{ n }}</span>
            </div>
            <pre class="editor-content"><code>{{ previewMarkdownSource }}</code></pre>
          </div>

          <!-- 精致白色卡片纸张视口，具备滚动监听 -->
          <div class="markdown-rendered-view" v-else @scroll="handleMarkdownScroll" @click="handleMarkdownViewClick">
            <!-- 语雀式 mock 文档元信息头部 -->
            <div class="yuque-doc-header">
              <h1 class="yuque-doc-title">{{ fileName.replace(/\.md$/i, '') }}</h1>
              
              <div class="yuque-doc-meta">
                <div class="meta-left">
                  <!-- 精美 mock 头像 -->
                  <div class="meta-avatar" :style="{ background: 'linear-gradient(135deg, #10b981, #059669)' }">A</div>
                  <span class="meta-author">知序智学管理员</span>
                  <span class="meta-dot">•</span>
                  <span class="meta-time">更新于 {{ new Date().toLocaleDateString() }}</span>
                  <span class="meta-dot">•</span>
                  <span class="meta-read-count">阅读数 1,280</span>
                </div>
                <div class="meta-right">
                  <span class="meta-words-badge">字数 {{ previewMarkdownSource ? Math.round(previewMarkdownSource.length * 0.7) : 0 }} 字</span>
                </div>
              </div>
            </div>
            <!-- Markdown 核心渲染正文 -->
            <div class="markdown-body" v-html="previewMarkdownHtml"></div>
          </div>

          <!-- 右侧浮动文档大纲 TOC -->
          <div class="markdown-toc-sidebar" v-show="showToc" v-if="!mdSourceMode && markdownToc.length > 0">
            <div class="toc-sidebar-header">
              <span class="toc-title">大纲</span>
              <div class="toc-actions">
                <button class="toc-action-btn" title="隐藏大纲" @click="showToc = false">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
                <button class="toc-action-btn" title="多级列表">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div class="toc-tree-container">
              <div 
                v-for="(item, idx) in markdownToc" 
                :key="idx" 
                class="toc-tree-item"
                :class="[`level-${item.level}`, { 'active': activeTocId === item.id }]"
                @click="scrollToHeading(item.id)"
              >
                <span class="toc-bullet">▾</span>
                <span class="toc-text" :title="item.text">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 7. 视频预览 (太空舱外框、多倍速、按键指示气泡) ==================== -->
      <div v-else-if="isPreviewableVideo(fileExt)" class="standalone-viewport-video">
        <div class="video-spacecraft-frame">
          <video 
            ref="videoPlayerRef"
            controls 
            autoplay 
            :src="previewUrl" 
            class="preview-video-tag"
            @play="handleVideoPlayState(true)"
            @pause="handleVideoPlayState(false)"
          ></video>

          <div class="video-key-toast" :class="{ 'show': videoToastVisible }">
            {{ videoToastText }}
          </div>

          <div class="video-speed-selector">
            <span class="speed-label">播放倍速：</span>
            <span 
              v-for="speed in [0.5, 1.0, 1.25, 1.5, 2.0]" 
              :key="speed" 
              class="speed-opt"
              :class="{ 'active': videoSpeed === speed }"
              @click="changeVideoSpeed(speed)"
            >
              {{ speed }}x
            </span>
          </div>

          <div class="video-tech-meta">
            <span class="tech-item"><span class="tech-dot"></span>快捷键：[空格] 播放/暂停 | [←/→] 5s快进/退 | [↑/↓] 音量调节</span>
          </div>
        </div>
      </div>

      <!-- ==================== 8. 音频预览 (黑胶唱片、✨ 高清防闪烁 Canvas 频谱) ==================== -->
      <div v-else-if="isPreviewableAudio(fileExt)" class="standalone-viewport-audio">
        <canvas ref="audioCanvasRef" class="audio-visualizer-canvas"></canvas>

        <div class="vinyl-record-card premium-glass">
          <div class="vinyl-turntable">
            <div class="vinyl-disc" :class="{ 'is-playing': isAudioPlaying }">
              <div class="vinyl-disc-inner">
                <div class="vinyl-disc-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vinyl-icon">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              </div>
            </div>
            <!-- 物理起落Tonearm唱针 -->
            <div class="vinyl-arm" :class="{ 'is-playing': isAudioPlaying }"></div>
          </div>
          
          <div class="audio-info">
            <span class="audio-title">{{ fileName }}</span>
            <span class="audio-artist-sub">知序智学高保真拟物唱机</span>
          </div>

          <audio 
            ref="audioPlayerRef"
            controls 
            autoplay 
            :src="previewUrl" 
            class="premium-preview-audio" 
            @play="handleAudioPlayState(true)" 
            @pause="handleAudioPlayState(false)" 
            @ended="handleAudioPlayState(false)"
          ></audio>
          
          <div class="visualizer-hint-pulse" v-if="isAudioPlaying">
            <div class="hint-bar b1"></div>
            <div class="hint-bar b2"></div>
            <div class="hint-bar b3"></div>
            <span style="font-size: 0.72rem; color: #10b981; margin-left: 6px;">高清波形频谱分析仪已锁定</span>
          </div>
        </div>
      </div>

      <!-- ==================== 9. 代码/纯文本预览 (搜索高亮、自动折行、浅色/深色高亮) ==================== -->
      <div v-else-if="isPreviewableText(fileExt)" class="standalone-viewport-text">
        <div class="preview-text-header">
          <div class="header-left">
            <span class="text-format-badge">{{ fileExt.toUpperCase() }} 极客格式</span>
            <span class="match-count-badge" v-if="codeSearchQuery">已匹配: {{ codeMatchCount }} 处</span>
          </div>
          <div class="header-right">
            <el-input 
              v-model="codeSearchQuery" 
              placeholder="🔍 检索代码关键字..." 
              clearable 
              size="small" 
              class="code-search-box"
            />
            
            <el-button 
              :type="codeWrapLines ? 'success' : 'default'" 
              size="small" 
              class="copy-btn"
              @click="codeWrapLines = !codeWrapLines"
            >
              ↩️ 自动换行: {{ codeWrapLines ? '开启' : '关闭' }}
            </el-button>

            <el-button type="primary" size="small" class="copy-btn" @click="handleCopyText">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right: 4px;">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {{ copyTextSuccess ? '已复制!' : '复制代码' }}
            </el-button>
          </div>
        </div>
        
        <div class="preview-text-editor">
          <div class="editor-line-numbers">
            <span v-for="n in previewTextContent.split('\n').length" :key="n" class="line-number">{{ n }}</span>
          </div>
          <pre class="editor-content" :class="{ 'wrap-lines': codeWrapLines }"><code v-html="highlightedCodeHtml"></code></pre>
        </div>
      </div>

      <!-- ==================== 10. 不支持的格式 (星环全息卡片) ==================== -->
      <div v-else class="preview-unsupported">
        <div class="glass-container aurora-glowing-card">
          <div class="unsupported-space-orbit">
            <div class="space-center-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" class="unsupported-svg-glow">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div class="orbit-ring r1"></div>
            <div class="orbit-ring r2"></div>
          </div>
          
          <h3 class="unsupported-title">暂不支持在线解析该格式</h3>
          
          <div class="unsupported-meta-panel">
            <div class="meta-row"><span class="m-label">文件名称:</span><span class="m-val" :title="fileName">{{ fileName }}</span></div>
            <div class="meta-row"><span class="m-label">文件大小:</span><span class="m-val">{{ formatSize(fileSize) }}</span></div>
            <div class="meta-row"><span class="m-label">识别后缀:</span><span class="m-val font-code">{{ fileExt.toUpperCase() || '未知' }}</span></div>
          </div>

          <p class="unsupported-desc">建议您通过右上方按钮将其下载至本地计算机，使用专业工具安全运行。</p>
          
          <div class="unsupported-qrcode-section">
            <div class="mock-qrcode-card">
              <div class="qrcode-grid">
                <div class="q-corner qt-left"></div>
                <div class="q-corner qt-right"></div>
                <div class="q-corner qb-left"></div>
                <div class="q-matrix"></div>
              </div>
              <span class="qrcode-text">手机扫码快速下载</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPreviewUrl, downloadFile } from '@/api/resource'
import request from '@/utils/request'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

import iconPpt from '@/assets/folder/ppt.png'

const route = useRoute()

// ==================== 💡 主题切换系统 (精美日夜双态旋转按钮，默认白天模式) ====================
type ThemeType = 'light' | 'dark'
const currentTheme = ref<ThemeType>((localStorage.getItem('preview-theme') as ThemeType) || 'light')

const handleToggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('preview-theme', currentTheme.value)
  ElMessage({
    message: `已应用: ${currentTheme.value === 'light' ? '清雅白天模式' : '极客夜晚模式'}`,
    type: 'success',
    duration: 1200
  })
}

// 路由 Query 信息
const fileId = ref(String(route.query.id || ''))
const fileName = ref(String(route.query.name || ''))
const fileSize = ref(Number(route.query.size || 0))
const fileExt = ref(fileName.value.split('.').pop()?.toLowerCase() || '')

// 状态声明
const loading = ref(true)
const initialized = ref(false)
const previewUrl = ref('')

const isLocalhostEnv = ref(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.')
)

// ==================== 1. 图片预览控制手柄与拖拽平移 ====================
const imgScale = ref(1)
const imgRotate = ref(0)
const imgTranslate = ref({ x: 0, y: 0 })
const isDraggingImg = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const imgScalePercent = computed(() => Math.round(imgScale.value * 100))

const imageTransformStyle = computed(() => {
  return {
    transform: `scale(${imgScale.value}) rotate(${imgRotate.value}deg) translate(${imgTranslate.value.x}px, ${imgTranslate.value.y}px)`,
    transition: isDraggingImg.value ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
})

const adjustImgScale = (delta: number) => {
  const next = imgScale.value + delta
  if (next >= 0.1 && next <= 6) {
    imgScale.value = next
  }
}

const rotateImg = () => {
  imgRotate.value = (imgRotate.value + 90) % 360
}

const resetImg = () => {
  imgScale.value = 1
  imgRotate.value = 0
  imgTranslate.value = { x: 0, y: 0 }
}

const toggleImgFullscreen = () => {
  const el = document.querySelector('.standalone-viewport-image')
  if (el) {
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => {
        ElMessage.error(`全屏切换失败: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }
}

const handleImgWheel = (e: WheelEvent) => {
  const zoomFactor = 0.08
  const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor
  adjustImgScale(delta)
}

const handleImgMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  isDraggingImg.value = true
  dragStart.value = {
    x: e.clientX - imgTranslate.value.x * imgScale.value,
    y: e.clientY - imgTranslate.value.y * imgScale.value
  }
}

const handleImgMouseMove = (e: MouseEvent) => {
  if (!isDraggingImg.value) return
  imgTranslate.value = {
    x: (e.clientX - dragStart.value.x) / imgScale.value,
    y: (e.clientY - dragStart.value.y) / imgScale.value
  }
}

const handleImgMouseUp = () => {
  isDraggingImg.value = false
}

// ==================== 2. PDF 骨架屏 ====================
const pdfLoading = ref(true)

// ==================== 3. Excel 模糊搜索高亮与过滤 ====================
const excelSearchQuery = ref('')
interface ExcelSheetData {
  name: string
  headers: string[]
  rows: Record<string, any>[]
  colWidths: number[]
}
const excelSheets = ref<ExcelSheetData[]>([])
const activeExcelSheet = ref(0)

const filteredExcelRows = computed(() => {
  const currentSheet = excelSheets.value[activeExcelSheet.value]
  if (!currentSheet) return []
  const query = excelSearchQuery.value.trim().toLowerCase()
  if (!query) return currentSheet.rows

  return currentSheet.rows.filter(row => {
    return Object.values(row).some(cellVal => 
      String(cellVal || '').toLowerCase().includes(query)
    )
  })
})

const highlightExcelText = (text: any) => {
  const str = String(text || '')
  if (!str) return ''
  const query = excelSearchQuery.value.trim()
  if (!query) return str
  
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return str.replace(regex, '<mark class="excel-search-highlight">$1</mark>')
}

// ==================== 4. Word 页面缩放 ====================
const docxContainerRef = ref<HTMLElement | null>(null)
const docxWideMode = ref(false)
const docxZoom = ref(100)

const adjustDocxZoom = (delta: number) => {
  const next = docxZoom.value + delta
  if (next >= 60 && next <= 160) {
    docxZoom.value = next
  }
}

// ==================== 6. Markdown 双态视图与目录 TOC ====================
const mdSourceMode = ref(false)
const showToc = ref(true)
const previewMarkdownSource = ref('')
const previewMarkdownHtml = ref('')
interface TocItem {
  id: string
  text: string
  level: number
}
const markdownToc = ref<TocItem[]>([])
const activeTocId = ref('')

const generateMarkdownToc = () => {
  const tocList: TocItem[] = []
  const customRenderer = new marked.Renderer()
  let headingIndex = 0
  
  customRenderer.heading = (token: any) => {
    const { text, depth, raw } = token
    headingIndex++
    const cleanRaw = (raw || '').toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    const uniqueId = `md-heading-${headingIndex}-${cleanRaw}`
    tocList.push({
      id: uniqueId,
      text: text.replace(/<[^>]*>/g, ''),
      level: depth
    })
    return `<h${depth} id="${uniqueId}">${text}</h${depth}>`
  }
  
  customRenderer.code = (token: any) => {
    const { text, lang } = token
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    try {
      const highlighted = hljs.highlight(text, { language }).value
      return `<pre class="hljs"><code class="language-${language}">${highlighted}</code><button class="copy-code-btn" data-code="${encodeURIComponent(text)}">复制</button></pre>`
    } catch (err) {
      console.warn('Markdown 代码块高亮渲染失败', err)
      return `<pre class="hljs"><code class="language-${language}">${text}</code><button class="copy-code-btn" data-code="${encodeURIComponent(text)}">复制</button></pre>`
    }
  }
  
  try {
    previewMarkdownHtml.value = marked.parse(previewMarkdownSource.value, {
      renderer: customRenderer,
      gfm: true,
      breaks: true
    } as any) as string
    markdownToc.value = tocList
    if (tocList.length > 0) {
      activeTocId.value = tocList[0].id
    }
  } catch (err) {
    console.error('Markdown 渲染崩溃，已启动自动源码降级', err)
    ElMessage.error('Markdown 格式解析失败，已为您切换为源码视图')
    mdSourceMode.value = true
  }
}

// 监听 Markdown 滚动, 动态高亮大纲对应的当前阅读章节 (语雀级学术机制)
const handleMarkdownScroll = (e: Event) => {
  const container = e.currentTarget as HTMLElement
  const headings = container.querySelectorAll('h1, h2, h3, h4')
  let currentActiveId = ''
  const containerTop = container.getBoundingClientRect().top
  
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i] as HTMLElement
    const rect = heading.getBoundingClientRect()
    // 标题的顶部位置如果滚动到了离容器顶部 100px 以内的区域，它就是激活项
    if (heading.id && rect.top - containerTop <= 120) {
      currentActiveId = heading.id
    } else if (rect.top - containerTop > 120) {
      break
    }
  }
  
  if (currentActiveId) {
    activeTocId.value = currentActiveId
  }
}

// Markdown 表格行及代码复制等点击事件代理
const handleMarkdownViewClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement
  
  if (target.classList.contains('copy-code-btn')) {
    const code = decodeURIComponent(target.getAttribute('data-code') || '')
    try {
      await navigator.clipboard.writeText(code)
      target.textContent = '已复制'
      setTimeout(() => {
        target.textContent = '复制'
      }, 2000)
    } catch (err) {
      ElMessage.error('复制失败')
    }
    return
  }
  
  const tr = target.closest('tr')
  if (!tr) return
  
  const table = tr.closest('table')
  if (!table) return
  
  const rows = table.querySelectorAll('tr')
  rows.forEach(row => {
    row.classList.remove('md-table-row-active')
  })
  
  tr.classList.add('md-table-row-active')
}

const scrollToHeading = (id: string) => {
  activeTocId.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ==================== 7. 视频快捷键支持与倍速 ====================
const videoPlayerRef = ref<HTMLVideoElement | null>(null)
const videoSpeed = ref(1.0)
const videoToastText = ref('')
const videoToastVisible = ref(false)
let toastTimer: any = null

const changeVideoSpeed = (speed: number) => {
  videoSpeed.value = speed
  if (videoPlayerRef.value) {
    videoPlayerRef.value.playbackRate = speed
    triggerVideoToast(`播放速度: ${speed}x`)
  }
}

const triggerVideoToast = (text: string) => {
  videoToastText.value = text
  videoToastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    videoToastVisible.value = false
  }, 1000)
}

const handleVideoPlayState = (isPlaying: boolean) => {
  triggerVideoToast(isPlaying ? '播放 ▶️' : '暂停 ⏸️')
}

const handleVideoKeydown = (e: KeyboardEvent) => {
  if (!videoPlayerRef.value || !isPreviewableVideo(fileExt.value)) return
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
  
  switch (e.key) {
    case ' ':
      e.preventDefault()
      if (videoPlayerRef.value.paused) {
        videoPlayerRef.value.play()
      } else {
        videoPlayerRef.value.pause()
      }
      break
    case 'ArrowLeft':
      e.preventDefault()
      videoPlayerRef.value.currentTime = Math.max(0, videoPlayerRef.value.currentTime - 5)
      triggerVideoToast('快退 -5s ⏪')
      break
    case 'ArrowRight':
      e.preventDefault()
      videoPlayerRef.value.currentTime = Math.min(videoPlayerRef.value.duration || 0, videoPlayerRef.value.currentTime + 5)
      triggerVideoToast('快进 +5s ⏩')
      break
    case 'ArrowUp':
      e.preventDefault()
      videoPlayerRef.value.volume = Math.min(1, videoPlayerRef.value.volume + 0.1)
      triggerVideoToast(`音量: ${Math.round(videoPlayerRef.value.volume * 100)}% 🔊`)
      break
    case 'ArrowDown':
      e.preventDefault()
      videoPlayerRef.value.volume = Math.max(0, videoPlayerRef.value.volume - 0.1)
      triggerVideoToast(`音量: ${Math.round(videoPlayerRef.value.volume * 100)}% 🔈`)
      break
  }
}

// ==================== 8. 音频极品拟物唱片与 Canvas 频谱 (✨ 高保真防闪烁) ====================
const audioPlayerRef = ref<HTMLAudioElement | null>(null)
const audioCanvasRef = ref<HTMLCanvasElement | null>(null)
const isAudioPlaying = ref(false)

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let audioSource: MediaElementAudioSourceNode | null = null
let visualizerFrameId = 0

// 精准 Canvas 高清自适应尺寸设定（彻底抽离出draw循环，防闪烁）
const resizeCanvas = () => {
  if (!audioCanvasRef.value) return
  const canvas = audioCanvasRef.value
  const parent = canvas.parentElement
  const width = parent?.clientWidth || 400
  const dpr = window.devicePixelRatio || 1
  
  // 设置物理宽高
  canvas.width = width * dpr
  canvas.height = 120 * dpr
  
  // 设置 CSS 样式宽高实现 Retinal 高清支持
  canvas.style.width = '100%'
  canvas.style.height = '120px'
}

const initAudioVisualizer = () => {
  if (audioCtx) return 
  if (!audioPlayerRef.value || !audioCanvasRef.value) return

  try {
    resizeCanvas() // 只在初始化时设定一次尺寸，绝对不在渲染循环中设定！
    
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new AudioCtx()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    
    audioSource = audioCtx.createMediaElementSource(audioPlayerRef.value)
    audioSource.connect(analyser)
    analyser.connect(audioCtx.destination)
    
    drawVisualizer()
  } catch (err) {
    console.warn('Web Audio API 频谱分析初始化失败', err)
  }
}

const drawVisualizer = () => {
  if (!analyser || !audioCanvasRef.value) return
  const canvas = audioCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    visualizerFrameId = requestAnimationFrame(draw)
    analyser!.getByteFrequencyData(dataArray)

    // 仅清空画布，决不重写 canvas.width 以防上下文被销毁闪烁
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barSpacing = 8 * (window.devicePixelRatio || 1)
    const barWidth = (canvas.width / bufferLength) - barSpacing
    let barHeight
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.82
      
      const hue = currentTheme.value === 'dark'
        ? (i * 360) / bufferLength + 195 // 极光蓝青紫
        : (i * 360) / bufferLength + 135 // 清亮翡翠绿

      const gradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - barHeight)
      gradient.addColorStop(0, `hsla(${hue}, 80%, 55%, 0.1)`)
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 55%, 0.5)`)
      gradient.addColorStop(1, `hsla(${hue}, 90%, 60%, 0.95)`)

      ctx.fillStyle = gradient
      
      // 绘制上圆角跳动波形柱
      ctx.beginPath()
      const rx = x
      const ry = canvas.height - barHeight
      const rw = barWidth
      const rh = barHeight
      const radius = 6 * (window.devicePixelRatio || 1)
      
      if (rh > radius) {
        ctx.moveTo(rx + radius, ry)
        ctx.lineTo(rx + rw - radius, ry)
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius)
        ctx.lineTo(rx + rw, ry + rh)
        ctx.lineTo(rx, ry + rh)
        ctx.lineTo(rx, ry + radius)
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry)
      } else {
        ctx.rect(rx, ry, rw, rh)
      }
      ctx.closePath()
      ctx.fill()

      x += barWidth + barSpacing
    }
  }
  
  draw()
}

const handleAudioPlayState = (playing: boolean) => {
  isAudioPlaying.value = playing
  if (playing) {
    initAudioVisualizer()
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  }
}

// ==================== 9. 代码语法高亮高保真与搜索定位 ====================
const previewTextContent = ref('')
const codeSearchQuery = ref('')
const codeWrapLines = ref(false)

const codeMatchCount = computed(() => {
  const query = codeSearchQuery.value.trim()
  if (!query || !previewTextContent.value) return 0
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const matches = previewTextContent.value.match(new RegExp(escapedQuery, 'gi'))
  return matches ? matches.length : 0
})

const highlightedCodeHtml = computed(() => {
  const rawText = previewTextContent.value
  if (!rawText) return ''
  
  let hlCode = ''
  try {
    const lang = hljs.getLanguage(fileExt.value) ? fileExt.value : undefined
    hlCode = lang 
      ? hljs.highlight(rawText, { language: lang }).value 
      : hljs.highlightAuto(rawText).value
  } catch {
    hlCode = rawText
  }
  
  const query = codeSearchQuery.value.trim()
  if (!query) return hlCode
  
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const regex = new RegExp(`(?<!<[^>]*)(${escapedQuery})(?![^<]*>)`, 'gi')
  return hlCode.replace(regex, '<mark class="code-search-highlight">$1</mark>')
})

// ==================== 10. 生命与监听绑定 ====================
onMounted(() => {
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleVideoKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleVideoKeydown)
  
  if (visualizerFrameId) cancelAnimationFrame(visualizerFrameId)
  if (audioCtx) audioCtx.close()
  
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

const isPreviewableImage = (ext: string) => ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)
const isPreviewableText = (ext: string) => ['txt', 'json', 'xml', 'yaml', 'yml', 'js', 'ts', 'py', 'java', 'sql', 'css', 'html'].includes(ext)
const isPreviewableVideo = (ext: string) => ['mp4', 'webm', 'ogv'].includes(ext)
const isPreviewableAudio = (ext: string) => ['mp3', 'wav', 'ogg'].includes(ext)
const isPreviewablePdf = (ext: string) => ext === 'pdf'
const isPreviewableWord = (ext: string) => ['doc', 'docx'].includes(ext)
const isPreviewablePpt = (ext: string) => ['ppt', 'pptx'].includes(ext)
const isPreviewableMarkdown = (ext: string) => ext === 'md'
const isPreviewableExcel = (ext: string) => ['xlsx', 'xls', 'csv'].includes(ext)

const getFileColor = (ext: string): string => {
  const colors: Record<string, string> = {
    pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6',
    ppt: '#f97316', pptx: '#f97316', xls: '#22c55e', xlsx: '#22c55e',
    png: '#a855f7', jpg: '#a855f7', jpeg: '#a855f7', gif: '#a855f7',
    mp4: '#06b6d4', avi: '#06b6d4', mov: '#06b6d4',
    mp3: '#10b981', wav: '#10b981',
    md: '#6366f1', txt: '#6b7280'
  }
  return colors[ext] || '#6b7280'
}

const getFileBg = (ext: string): string => getFileColor(ext) + '15'

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

// 数据初始化加载
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('您尚未登录或登录已失效，请重新登录后再预览')
    setTimeout(() => {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
    }, 1500)
    loading.value = false
    return
  }

  if (!fileId.value) {
    ElMessage.error('无效的文件预览参数')
    loading.value = false
    return
  }

  const ext = fileExt.value
  if (!isPreviewablePdf(ext)) {
    previewUrl.value = getPreviewUrl(fileId.value) + `&t=${Date.now()}`
  } else {
    previewUrl.value = ''
  }

  try {
    if (isPreviewableWord(ext)) {
      const arrayBuffer = await request.get<ArrayBuffer>(`/yun-resource/preview/${fileId.value}`, {
        responseType: 'arraybuffer'
      })
      const docx = await import('docx-preview')
      initialized.value = true
      setTimeout(async () => {
        if (docxContainerRef.value) {
          docxContainerRef.value.innerHTML = ''
          await docx.renderAsync(arrayBuffer, docxContainerRef.value, undefined, {
            className: 'docx-preview-body',
            inWrapper: false
          })
        }
      }, 100)
    } else if (isPreviewableMarkdown(ext)) {
      const text = await request.get<string>(`/yun-resource/preview/${fileId.value}`, {
        responseType: 'text'
      })
      previewMarkdownSource.value = text
      generateMarkdownToc()
      initialized.value = true
    } else if (isPreviewableText(ext)) {
      let text = await request.get<string>(`/yun-resource/preview/${fileId.value}`, {
        responseType: 'text'
      })
      const MAX_PREVIEW_SIZE = 2 * 1024 * 1024
      if (text.length > MAX_PREVIEW_SIZE) {
        text = text.substring(0, MAX_PREVIEW_SIZE) + '\n\n...[内容过长已被部分截取展示]...'
      }
      previewTextContent.value = text
      initialized.value = true
    } else if (isPreviewableExcel(ext)) {
      const MAX_EXCEL_SIZE = 5 * 1024 * 1024
      if (fileSize.value > MAX_EXCEL_SIZE) {
        ElMessage.warning('该表格文件过大，为防止网页 DOM 渲染卡死，已拦截在线预览，建议您点击右上方下载后查看。')
        throw new Error('表格文件过大')
      }

      const arrayBuffer = await request.get<ArrayBuffer>(`/yun-resource/preview/${fileId.value}`, {
        responseType: 'arraybuffer'
      })
      
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
      
      const sheetsData: ExcelSheetData[] = []
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' })
        if (rawRows.length === 0) continue
        
        const headers: string[] = (rawRows[0] as any[]).map(item => item !== null && item !== undefined ? String(item).trim() : '')
        const rows: Record<string, any>[] = []
        for (let i = 1; i < rawRows.length; i++) {
          const rowData = rawRows[i] as any[]
          const rowObj: Record<string, any> = {}
          headers.forEach((header, index) => {
            const val = rowData[index]
            rowObj[header || `COLUMN_${index + 1}`] = val !== null && val !== undefined ? String(val) : ''
          })
          rows.push(rowObj)
        }
        
        const colWidths: number[] = headers.map((header, index) => {
          let maxLen = header.length * 15 + 40
          const scanLimit = Math.min(rows.length, 100)
          for (let r = 0; r < scanLimit; r++) {
            const val = rows[r][header || `COLUMN_${index + 1}`]
            if (val) {
              const valLen = String(val).length * 9 + 30
              if (valLen > maxLen) maxLen = valLen
            }
          }
          return Math.min(Math.max(maxLen, 80), 450)
        })

        sheetsData.push({ name: sheetName, headers, rows, colWidths })
      }
      if (sheetsData.length === 0) throw new Error('Excel中没有有效数据工作表')
      excelSheets.value = sheetsData
      activeExcelSheet.value = 0
      initialized.value = true
    } else if (isPreviewablePpt(ext)) {
      if (!isLocalhostEnv.value) {
        const absoluteUrl = window.location.origin + getPreviewUrl(fileId.value)
        previewUrl.value = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`
      }
      initialized.value = true
    } else if (isPreviewablePdf(ext)) {
      const blob = await request.get<Blob>(`/yun-resource/preview/${fileId.value}`, {
        responseType: 'blob'
      })
      if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value)
      }
      previewUrl.value = URL.createObjectURL(new Blob([blob as any], { type: 'application/pdf' }))
      initialized.value = true
    } else {
      initialized.value = true
    }
  } catch (error: any) {
    console.error('加载独立预览页面失败', error)
    if (error?.message !== '表格文件过大') {
      ElMessage.error('文件解析失败，建议您下载后查看')
    }
  } finally {
    loading.value = false
  }
})

const handleDownload = () => {
  if (!fileId.value) return
  ElMessage.success(`开始下载: ${fileName.value}`)
  downloadFile(fileId.value, fileName.value)
}

const handleClose = () => {
  window.close()
}

const copyTextSuccess = ref(false)
const handleCopyText = async () => {
  const content = previewTextContent.value || previewMarkdownSource.value
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    copyTextSuccess.value = true
    ElMessage.success('全部内容已成功复制')
    setTimeout(() => {
      copyTextSuccess.value = false
    }, 2000)
  } catch {
    ElMessage.error('复制失败，请手动选择复制')
  }
}
</script>

<style scoped lang="scss">
.standalone-preview-page {
  /* ==================== ☀️ 白天模式 HSL 质感渐变变量 ==================== */
  --bg-primary: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 40%),
                #ffffff;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: rgba(15, 23, 42, 0.08);
  --border-light: rgba(15, 23, 42, 0.04);
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(15, 23, 42, 0.08);
  --toolbar-bg: rgba(255, 255, 255, 0.85);
  --shadow-color: rgba(15, 23, 42, 0.06);
  --neon-glow: rgba(37, 99, 235, 0.06);
  
  --btn-bg: rgba(15, 23, 42, 0.03);
  --btn-hover-bg: rgba(15, 23, 42, 0.06);
  --btn-border: rgba(15, 23, 42, 0.08);
  --btn-hover-border: rgba(37, 99, 235, 0.35);
  --btn-text: #334155;
  
  --excel-grid: #ffffff;
  --excel-header: #ebf2fe;
  --excel-stripe: #ffffff; /* 彻底全白化，杜绝蓝白相间条纹 */
  --excel-text: #1e293b;
  
  --docx-wrapper-bg: rgba(15, 23, 42, 0.04);
  --md-bg: rgba(255, 255, 255, 0.8);
  --md-border: rgba(0, 0, 0, 0.05);
  --md-text: #0f172a;
  
  --code-editor-bg: #f8fafc;
  --code-editor-header: rgba(241, 245, 249, 0.8);
  --code-editor-numbers: rgba(241, 245, 249, 0.5);
  --code-editor-border: rgba(0, 0, 0, 0.08);
  --code-text: #334155;
  --code-number-text: #94a3b8;
  
  /* 表格悬浮与选中行发光变量 (亮色模式 - 双重蓝色分级高亮) */
  --row-hover-bg: rgba(37, 99, 235, 0.04) !important; /* 4% 极浅天青蓝悬浮高亮，极其柔和 */
  --row-active-bg: rgba(37, 99, 235, 0.15) !important; /* 15% 清凉亮天蓝选中高亮，对比鲜明 */
  --row-active-border: #1d4ed8;
  --row-active-shadow: rgba(37, 99, 235, 0.10) !important;
}

/* ==================== 🌙 夜晚模式 极客深空渐变变量 ==================== */
.standalone-preview-page.dark-theme {
  --bg-primary: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                #0d111d;
  --bg-secondary: #0f172a;
  --bg-tertiary: #020617;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: rgba(255, 255, 255, 0.08);
  --border-light: rgba(255, 255, 255, 0.04);
  --glass-bg: rgba(15, 23, 42, 0.75);
  --glass-border: rgba(255, 255, 255, 0.1);
  --toolbar-bg: rgba(8, 12, 20, 0.85);
  --shadow-color: rgba(0, 0, 0, 0.6);
  --neon-glow: rgba(56, 189, 248, 0.15);
  
  --btn-bg: rgba(255, 255, 255, 0.05);
  --btn-hover-bg: rgba(255, 255, 255, 0.12);
  --btn-border: rgba(255, 255, 255, 0.1);
  --btn-hover-border: rgba(56, 189, 248, 0.4);
  --btn-text: #cbd5e1;
  
  --excel-grid: #0f172a;
  --excel-header: #020617;
  --excel-stripe: rgba(255, 255, 255, 0.02);
  --excel-text: #cbd5e1;
  
  --docx-wrapper-bg: #020617;
  --md-bg: rgba(15, 23, 42, 0.65);
  --md-border: rgba(255, 255, 255, 0.06);
  --md-text: #cbd5e1;
  
  --code-editor-bg: #020617;
  --code-editor-header: rgba(15, 23, 42, 0.8);
  --code-editor-numbers: rgba(15, 23, 42, 0.4);
  --code-editor-border: rgba(255, 255, 255, 0.08);
  --code-text: #cbd5e1;
  --code-number-text: #475569;
  
  /* 表格悬浮与选中行发光变量 (暗色模式 - 精致极光蓝) */
  --row-hover-bg: rgba(2, 132, 199, 0.15) !important;
  --row-active-bg: linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(2, 132, 199, 0.10) 100%) !important;
  --row-active-border: #0284c7;
  --row-active-shadow: rgba(2, 132, 199, 0.2) !important;
}

.standalone-preview-page {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  /* 全局艺术几何微晶网格 */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(var(--border-light) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border-light) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.65;
    pointer-events: none;
    z-index: 1;
  }
}

/* 顶部磨砂玻璃工具栏 */
.preview-toolbar {
  height: 66px;
  background: var(--toolbar-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
  z-index: 10;
  box-shadow: 0 4px 20px var(--shadow-color);
  transition: all 0.4s ease;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.file-ext-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.file-meta-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-title {
  margin: 0;
  font-size: 1.0rem;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.toolbar-btn {
  background: var(--btn-bg) !important;
  border: 1px solid var(--btn-border) !important;
  color: var(--btn-text) !important;
  border-radius: 10px !important;
  font-weight: 600;
  padding: 10px 18px !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    background: var(--btn-hover-bg) !important;
    border-color: var(--btn-hover-border) !important;
    color: var(--text-primary) !important;
    box-shadow: 0 0 10px var(--neon-glow);
  }
}

.theme-toggle-btn {
  border-color: var(--btn-border) !important;
}

/* ☀️/🌙 主题图标丝滑旋转物理效果 */
.theme-icon-container {
  display: inline-block;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &.rotate-active {
    transform: rotate(360deg) scale(1.05);
  }
}

.close-btn {
  background: #2563eb !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25) !important;
  
  &:hover {
    background: #1d4ed8 !important;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45) !important;
  }
}

/* 主体预览区 */
.preview-viewport {
  flex: 1;
  width: 100%;
  height: calc(100vh - 66px);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2; /* 位于背景之上 */
}

/* ==================== 1. 图片预览 (含透明格底纹、手柄、拖拽) ==================== */
.standalone-viewport-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  cursor: grab;
  padding: 24px;
  background-image: radial-gradient(var(--border-light) 25%, transparent 25%),
                    radial-gradient(var(--border-light) 25%, transparent 25%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  
  &:active {
    cursor: grabbing;
  }
}

.image-zoom-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 95%;
  max-height: 95%;
}

.preview-image-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  box-shadow: 0 20px 50px var(--shadow-color);
  pointer-events: none;
}

.image-control-float-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  padding: 6px 14px;
  border-radius: 99px;
  box-shadow: 0 10px 25px var(--shadow-color);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
  
  .img-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 99px;
  }
  
  .control-divider {
    width: 1px;
    height: 16px;
    background: var(--border-color);
  }
  
  .float-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 50%;
    transition: all 0.25s ease;
    
    &:hover {
      color: #38bdf8;
      background: rgba(0, 0, 0, 0.04);
      transform: scale(1.15);
    }
  }
}

.dark-theme {
  .image-control-float-bar .img-badge {
    background: rgba(255, 255, 255, 0.1);
  }
  .image-control-float-bar .float-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* ==================== 2. PDF 预览 ==================== */
.standalone-viewport-pdf,
.standalone-viewport-ppt {
  width: 100%;
  height: 100%;
  padding: 16px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.pdf-skeleton-wrapper {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  z-index: 5;
}

.tech-skeleton-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 40px;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  width: 320px;
  box-shadow: 0 15px 35px var(--shadow-color);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.skeleton-shimmer-bar {
  position: absolute;
  top: 0; left: -150%; width: 150%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.8s infinite;
}

@keyframes shimmer { 100% { left: 150%; } }

.skeleton-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--border-light);
}

.skeleton-line {
  height: 12px;
  background: var(--border-light);
  border-radius: 6px;
  &.width-60 { width: 60%; }
  &.width-80 { width: 80%; }
  &.width-40 { width: 40%; }
}

.skeleton-pulse-text {
  font-size: 0.8rem;
  color: #38bdf8;
  margin-top: 10px;
  animation: blink 1.5s infinite ease-in-out;
}

@keyframes blink { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

.pdf-card-frame {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  border-radius: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 50px var(--shadow-color);
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &.ready {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 3. Excel 办公表格预览 ==================== */
.standalone-viewport-excel {
  width: 100%;
  height: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
}

.excel-analysis-bar {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  backdrop-filter: blur(12px);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.analysis-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.excel-status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.analysis-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.analysis-tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  background: var(--border-light);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  
  &.search-match-tag {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.3);
    color: #ea580c;
  }
}

.excel-search-input {
  width: 250px;
  
  :deep(.el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.03) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: none !important;
    border-radius: 8px;
    
    .el-input__inner {
      color: var(--text-primary);
      font-size: 0.8rem;
    }
  }
}

.dark-theme .excel-search-input :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

:deep(.excel-search-highlight) {
  background-color: #f59e0b !important;
  color: #000000 !important;
  padding: 2px 4px;
  font-weight: 700;
  border-radius: 3px;
}

.excel-sheets-tabs {
  flex: 1;
  width: 100%;
  
  :deep(.el-tabs__item) {
    color: var(--text-secondary) !important;
    background: var(--btn-bg) !important;
    border: 1px solid var(--border-color) !important;
    font-size: 0.8rem;
    font-weight: 600;
    height: 38px;
    line-height: 38px;
    
    &.is-active {
      color: #10b981 !important;
      background: var(--bg-secondary) !important;
      border-bottom-color: transparent !important;
    }
  }
}

.excel-table-data {
  background: var(--excel-grid) !important;
  border-color: var(--border-color) !important;
  color: var(--excel-text) !important;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  
  :deep(th.el-table__cell) {
    background: var(--excel-header) !important;
    color: var(--excel-text) !important;
    font-weight: 800;
    border-bottom: 2px solid var(--border-color) !important;
    border-right: 1px solid var(--border-color) !important;
  }
  
  :deep(td.el-table__cell) {
    border-bottom: 1px solid var(--border-light) !important;
    border-right: 1px solid var(--border-light) !important;
    background: var(--excel-grid) !important;
    color: var(--excel-text) !important;
  }

  /* 序号列高清冷灰蓝底色 */
  :deep(.el-table__cell:first-child) {
    background: var(--bg-tertiary) !important;
    font-weight: 700 !important;
    color: var(--text-secondary) !important;
    border-right: 1px solid var(--border-color) !important;
  }

  :deep(.el-table__row--striped td) {
    background: var(--excel-stripe) !important;
  }
  
  /* 高奢悬浮发光与点击选中高亮动效 */
  :deep(.el-table__body tr) {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  :deep(.el-table__body tr:hover > td) {
    background: var(--row-hover-bg) !important;
    border-bottom-color: transparent !important;
    border-right-color: transparent !important;
  }
  
  :deep(.el-table__body tr:hover > td:first-child) {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    background: var(--row-hover-bg) !important;
  }
  
  :deep(.el-table__body tr:hover > td:last-child) {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }
  
  :deep(.el-table__body tr.current-row > td) {
    background: var(--row-active-bg) !important;
    color: var(--text-primary) !important;
    font-weight: 700;
    border-bottom-color: transparent !important;
    border-right-color: transparent !important;
  }
  
  :deep(.el-table__body tr.current-row > td:first-child) {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    background: var(--row-active-bg) !important;
  }
  
  :deep(.el-table__body tr.current-row > td:last-child) {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }
}

.excel-tech-hint {
  height: 38px;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.12);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  margin-top: 12px;
  font-size: 0.78rem;
  color: #10b981;
  gap: 10px;
}

.excel-hint-pulse {
  width: 7px; height: 7px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* ==================== 4. Word 预览 (极雅仿 3D 纸张卡片、缩放) ==================== */
.standalone-viewport-docx {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--docx-wrapper-bg);
  position: relative;
  transition: all 0.4s ease;
}

.docx-controls-panel {
  position: sticky;
  top: 0;
  margin-bottom: 20px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  padding: 8px 20px;
  border-radius: 99px;
  box-shadow: 0 8px 20px var(--shadow-color);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
  
  .panel-section {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .zoom-value {
    width: 54px;
    text-align: center;
    background: transparent !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    font-weight: 700;
  }
  
  .panel-divider {
    width: 1px;
    height: 18px;
    background: var(--border-color);
  }
}

.docx-a4-wrapper {
  width: 100%;
  box-shadow: 0 15px 40px var(--shadow-color);
  border-radius: 12px;
  background: #ffffff;
  color: #1e293b;
  padding: 45px 55px;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 黑暗模式 Word 卡片极雅墨灰护眼 */
.dark-theme {
  .docx-a4-wrapper {
    background: #182030;
    color: #e5e7eb;
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.5);
  }
  :deep(.docx-preview-body) {
    padding: 48px 64px 64px 64px; /* 宽大呼吸感的精装书籍内衬 */
    background: #ffffff !important; /* 白天模式下 100% 纯白纸张卡片 */
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 16px rgba(0, 0, 0, 0.03); /* 极致柔和的浮动纸张投影 */
    
    .dark-theme & {
      background: #18181c !important; /* 深邃护眼的黑 */
      border-color: #2e2e33;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
  }
  :deep(.docx-preview-body p), 
  :deep(.docx-preview-body span), 
  :deep(.docx-preview-body td), 
  :deep(.docx-preview-body h1),
  :deep(.docx-preview-body h2),
  :deep(.docx-preview-body h3) {
    color: #cbd5e1 !important;
  }
  :deep(.docx-preview-body table) {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}

/* ==================== 5. PPT 极光毛玻璃 Fallback ==================== */
.localhost-ppt-fallback {
  width: 100%;
  display: flex;
  justify-content: center;
}

.glass-container {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(20px);
  width: 480px;
  box-shadow: 0 20px 45px var(--shadow-color);
  position: relative;
}

.aurora-glowing-card::before {
  content: '';
  position: absolute;
  top: -10%; left: -10%; width: 120%; height: 120%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 60%);
  z-index: -1;
  pointer-events: none;
}

.dark-theme .aurora-glowing-card::before {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 60%);
}

.ppt-mock-cover {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.ppt-mock-icon-glow {
  background: rgba(249, 115, 22, 0.08);
  padding: 14px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.15);
}

.bounce-icon-3d {
  width: 44px; height: 44px;
  animation: float3d 3.5s infinite ease-in-out;
}

@keyframes float3d {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(3deg); }
}

.ppt-fallback-title {
  margin: 0;
  font-size: 1.0rem;
  font-weight: 700;
  color: var(--text-primary);
}

.file-size-badge {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.fallback-tips {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}

.alert-badge-glow {
  display: inline-flex;
  align-items: center;
  background: rgba(249, 115, 22, 0.08);
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.15);
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 14px;
  font-weight: 700;
}

.crystal-btn-container {
  margin-top: 20px;
}

.crystal-download-btn {
  width: 100%;
  background: linear-gradient(135deg, #f97316, #ea580c);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(234, 88, 12, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(234, 88, 12, 0.45);
  }
}

/* ==================== 6. Markdown 预览 ==================== */
/* ==================== 6. Markdown 预览 ==================== */
.standalone-viewport-markdown-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  background: #ffffff !important; /* 全局统一白色背景 */
  
  .dark-theme & {
    background: #121212 !important; /* 暗夜极致哑光黑底 */
  }
}

/* 语雀级面包屑控制栏 */
.markdown-control-bar {
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  padding: 10px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  
  .dark-theme & {
    background: #1e1e22;
  }
}

.md-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  
  .md-book-icon {
    color: var(--row-active-border);
    display: flex;
    align-items: center;
    margin-right: 2px;
  }
  
  .md-breadcrumb-item {
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .md-breadcrumb-separator {
    color: var(--text-muted);
    font-size: 0.75rem;
    user-select: none;
  }
  
  .md-breadcrumb-current {
    color: var(--text-primary);
    font-weight: 600;
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .md-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 12px;
    padding: 2px 8px;
    background: rgba(16, 185, 129, 0.08);
    color: #10b981;
    border-radius: 99px;
    font-size: 0.72rem;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.15);
    
    .cloud-success-icon {
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.md-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .md-bar-action-btn {
    background: transparent;
    border: none;
    padding: 6px;
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: var(--btn-bg);
      color: var(--text-primary);
      transform: scale(1.05);
    }
  }
  
  .md-action-divider {
    width: 1px;
    height: 16px;
    background: var(--border-color);
    margin: 0 4px;
  }
  
  .md-source-toggle {
    margin-left: 4px;
  }
}

.markdown-layout-wrapper {
  flex: 1;
  display: flex;
  gap: 24px;
  overflow: hidden;
  min-height: 0;
}

.markdown-raw-editor {
  flex: 1;
  background: var(--code-editor-bg);
  border: 1px solid var(--code-editor-border);
  border-radius: 8px;
  display: flex;
  overflow-y: auto;
  font-family: monospace;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  
  .editor-line-numbers {
    padding: 24px 12px;
    border-right: 1px solid var(--code-editor-border);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    user-select: none;
    background: rgba(0, 0, 0, 0.02);
    min-width: 48px;
    
    .line-number {
      font-family: Consolas, monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.6;
      height: 1.6em;
    }
  }
  
  .editor-content {
    margin: 0;
    padding: 24px;
    flex: 1;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    background: transparent;
    border: none;
    color: var(--code-text);
    
    code {
      font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
      font-size: 0.88rem;
      line-height: 1.6;
    }
  }
}

/* 精致白色卡片纸张视口 */
/* 完全融入背景的视口 */
.markdown-rendered-view {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 40px 60px 80px; /* 顶部/左右留白 */
  background: #ffffff !important; 
  border: none;
  box-shadow: none; 
  
  .dark-theme & {
    background: #121212 !important; 
    box-shadow: none;
  }
}

/* 语雀文档大标题及元信息区 */
.yuque-doc-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-light);
  
  .yuque-doc-title {
    font-size: 1.88rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
    margin: 0 0 16px 0;
    letter-spacing: -0.02em;
  }
  
  .yuque-doc-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    color: var(--text-muted);
    
    .meta-left {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .meta-avatar {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.65rem;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      }
      
      .meta-author {
        color: var(--text-secondary);
        font-weight: 600;
      }
      
      .meta-dot {
        color: var(--border-color);
      }
    }
    
    .meta-words-badge {
      background: var(--btn-bg);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      border: 1px solid var(--border-color);
    }
  }
}

/* 语雀悬浮大纲目录树 */
.markdown-toc-sidebar {
  width: 250px;
  background: transparent !important;
  border: none !important;
  padding: 40px 16px 24px;
  display: flex;
  flex-direction: column;
  box-shadow: none !important;
  flex-shrink: 0;
  
  .toc-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 8px;
    
    .toc-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #262626;
    }
    
    .toc-actions {
      display: flex;
      gap: 4px;
      
      .toc-action-btn {
        background: transparent;
        border: none;
        color: #8c8c8c;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, color 0.2s;
        
        &:hover {
          background: rgba(0,0,0,0.06);
          color: #262626;
        }
      }
    }
  }
  
  .toc-tree-container {
    flex: 1;
    overflow-y: auto;
    margin-top: 8px;
  }
  
  .toc-tree-item {
    font-size: 0.85rem;
    color: #595959;
    padding: 6px 8px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: background 0.2s;
    
    .toc-bullet {
      font-size: 0.6rem;
      color: #bfbfbf;
      margin-right: 6px;
      width: 12px;
      display: inline-block;
      text-align: center;
    }
    
    &:hover {
      background: #f5f5f5 !important;
    }
    
    /* 核心逻辑：滚动高亮选中项 */
    &.active {
      color: #262626 !important;
      font-weight: 600;
      background: #f5f5f5 !important;
    }
    
    &.level-1 { 
      padding-left: 8px;
    }
    
    &.level-2 { 
      padding-left: 20px;
    }
    
    &.level-3 { 
      padding-left: 32px;
    }
  }
}

/* 语雀正文排版系统 */
.markdown-body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif !important;
  color: #262626 !important; /* 精致温润的印刷墨灰，绝对不晃眼 */
  line-height: 1.8;
  background: transparent !important;
  font-size: 0.95rem; /* 精致 15px 字号 */
  word-break: break-word;
  max-width: 800px; /* 语雀经典 800px 限制 */
  margin: 0 auto;
  
  .dark-theme & {
    color: #dfdfdf !important; /* 暗色模式温和白灰 */
  }

  p {
    margin-top: 0;
    margin-bottom: 16px;
  }

  ul, ol {
    padding-left: 22px;
    margin-top: 0;
    margin-bottom: 16px;
  }

  ul {
    list-style: disc !important; /* 回归素雅经典小圆点 */
    
    li {
      margin-top: 6px;
      margin-bottom: 6px;
      color: var(--text-secondary);
    }
  }

  ol {
    list-style: decimal !important; /* 回归纯粹自然的数字列表 */
    
    li {
      margin-top: 6px;
      margin-bottom: 6px;
      color: var(--text-secondary);
      padding-left: 4px;
    }
  }
  
  a {
    color: #1677ff; /* 典型的亮蓝色链接 */
    text-decoration: none;
    transition: opacity 0.2s ease;
    
    &:hover {
      opacity: 0.8;
    }
  }

  img {
    max-width: 100%;
    border-radius: 4px;
    margin: 16px 0;
  }

  hr {
    height: 1px;
    border: none;
    background: #f0f0f0 !important;
    margin: 28px 0;
  }
  
  h1, h2, h3, h4 {
    color: #262626 !important;
    font-weight: 700;
    line-height: 1.5;
    margin-top: 24px;
    margin-bottom: 16px;
  }

  /* 彻底剥离粗鲁竖条装饰，仅保留纯粹高级的书本排版结构线 */
  h1 {
    font-size: 1.62rem;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-light) !important;
    margin-top: 0;
  }

  h2 {
    font-size: 1.38rem;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-light) !important;
  }

  h3 {
    font-size: 1.25em;
  }
  
  h4 {
    font-size: 1.1em;
  }
  
  /* 内联代码 */
  code {
    background-color: #f4f5f7 !important; /* 极薄温和浅灰 */
    color: #e0197d !important; /* 优雅的浆果色内联高亮 */
    border: 1px solid rgba(0, 0, 0, 0.04) !important;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: Consolas, Monaco, 'Andale Mono', monospace;
    font-size: 0.82rem;
    
    .dark-theme & {
      background-color: rgba(255, 255, 255, 0.06) !important;
      color: #f472b6 !important;
    }
  }

  /* 代码块 (完全剔除 Mac 繁冗红绿点，极致学术 Retina 排版) */
  pre {
    background: #f7f8fa !important; /* 纯洁极其舒适的浅灰白色 */
    border: 1px solid #e8e8e8 !important;
    border-radius: 6px;
    padding: 16px 18px;
    position: relative;
    box-shadow: none !important;
    margin: 18px 0;
    overflow: hidden;
    
    .dark-theme & {
      background: #1e1e22 !important;
      border-color: #333 !important;
    }
    
    &::before {
      display: none;
    }

    .copy-code-btn {
      position: absolute;
      top: 8px;
      right: 50px;
      background: var(--btn-bg);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 3;
    }
    
    &:hover .copy-code-btn {
      opacity: 1;
    }
    
    .copy-code-btn:hover {
      background: var(--btn-hover);
      color: var(--text-primary);
    }

    code {
      background-color: transparent !important;
      color: var(--code-text) !important;
      border: none !important;
      padding: 0 !important;
      box-shadow: none !important;
      font-size: 0.83rem;
      line-height: 1.6;
      display: block;
      
      /* 角标仅在 Hover 时显现或极度浅淡 */
      &::after {
        content: 'CODE';
        position: absolute;
        top: 8px; right: 10px;
        font-size: 0.62rem;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-muted);
        opacity: 0.45;
        background: var(--btn-bg);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        z-index: 2;
        transition: opacity 0.2s;
      }
      
      &:hover::after {
        opacity: 0.8;
      }
    }
  }

  /* 引用块 */
  blockquote {
    color: var(--text-secondary) !important;
    border-left: 3px solid #d9d9d9 !important; /* 语雀经典的 3px 灰色粗竖线 */
    background: #f7f8fa !important; /* 语雀浅灰底 */
    border-radius: 4px;
    padding: 10px 16px;
    margin: 18px 0;
    position: relative;
    overflow: hidden;
    box-shadow: none !important;
    
    .dark-theme & {
      background: #1e1e22 !important;
      border-left-color: #4a4a4f !important;
    }
    
    &::after {
      display: none;
    }

    p {
      margin: 0 !important;
      font-style: normal;
    }
  }
  
  /* 表格 (语雀经典极平整网格) */
  table {
    border-collapse: collapse;
    width: 100% !important;
    margin: 16px 0 !important;
    
    tr {
      background-color: #ffffff !important;
      border-top: 1px solid #e8e8e8 !important;
      transition: background-color 0.15s ease;
      
      .dark-theme & {
        background-color: #18181c !important;
        border-top-color: #2e2e33 !important;
      }
      
      &:nth-child(2n) { 
        background-color: #ffffff !important; 
        .dark-theme & {
          background-color: #18181c !important;
        }
      }
      
      &:hover {
        background-color: #fafafa !important;
        .dark-theme & {
          background-color: #202024 !important;
        }
        td {
          border-color: #e8e8e8 !important;
          background-color: #fafafa !important;
          .dark-theme & {
            border-color: #2e2e33 !important;
            background-color: #202024 !important;
          }
        }
      }
      
      &.md-table-row-active {
        background-color: rgba(37, 99, 235, 0.06) !important;
        
        td {
          font-weight: 600;
          color: var(--text-primary) !important;
          background-color: rgba(37, 99, 235, 0.06) !important;
        }
      }
    }
    th, td { 
      border: 1px solid #e8e8e8 !important; 
      padding: 10px 14px; 
      transition: all 0.15s ease;
      font-size: 0.88rem;
      
      .dark-theme & {
        border-color: #2e2e33 !important;
      }
    }
    th { 
      background: #fafafa !important; /* 经典表头微浅灰 */
      color: #262626 !important;
      font-weight: 600; 
      border-bottom: 2px solid #e8e8e8 !important;
      
      .dark-theme & {
        background: #202024 !important;
        color: #dfdfdf !important;
        border-color: #2e2e33 !important;
        border-bottom-color: #3e3e44 !important;
      }
    }
  }
}

/* ==================== 7. 视频太空舱控制 ==================== */
.standalone-viewport-video {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
}

.video-spacecraft-frame {
  position: relative;
  background: #000000;
  border-radius: 16px;
  border: 4px solid var(--bg-secondary);
  box-shadow: 0 20px 50px var(--shadow-color);
  max-width: 80%;
  max-height: 85%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-video-tag {
  width: 100%;
  max-height: 70vh;
  outline: none;
  display: block;
}

.video-key-toast {
  position: absolute;
  top: 40%; left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  background: rgba(0, 0, 0, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 99px;
  backdrop-filter: blur(8px);
  pointer-events: none;
  opacity: 0;
  z-index: 10;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.2);
  
  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.0);
  }
}

.video-speed-selector {
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 5;
  
  .speed-label { font-size: 0.68rem; color: #9ca3af; }
  .speed-opt {
    font-size: 0.68rem;
    color: #ffffff;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    transition: all 0.2s;
    
    &:hover { background: rgba(255, 255, 255, 0.15); }
    &.active {
      background: #06b6d4;
      box-shadow: 0 0 6px rgba(6, 182, 212, 0.5);
    }
  }
}

.video-tech-meta {
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  .tech-item { font-size: 0.72rem; color: #6b7280; display: flex; align-items: center; gap: 6px; }
  .tech-dot { width: 5px; height: 5px; background: #06b6d4; border-radius: 50%; }
}

/* ==================== 8. 音频极品拟物唱片与 Canvas 频谱 ==================== */
.standalone-viewport-audio {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
}

.audio-visualizer-canvas {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
  height: 120px;
  z-index: 1;
  pointer-events: none;
}

.vinyl-record-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  padding: 34px 34px 28px;
  border-radius: 24px;
  box-shadow: 0 20px 45px var(--shadow-color);
  text-align: center;
  width: 320px;
  backdrop-filter: blur(20px);
  transition: all 0.4s ease;
  z-index: 2;
  position: relative;
}

.vinyl-turntable {
  position: relative;
  width: 180px; height: 180px;
  margin: 0 auto 28px;
}

.vinyl-disc {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #475569 10%, #1e293b 35%, #020617 80%, #000000 100%);
  border: 5px solid var(--border-color);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  animation: spin 7s linear infinite;
  animation-play-state: paused;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 6%; left: 6%; right: 6%; bottom: 6%;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }
}

.vinyl-disc.is-playing { animation-play-state: running; }

.vinyl-disc-inner {
  width: 58px; height: 58px;
  border-radius: 50%;
  background: #10b981;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #000;
}

.vinyl-disc-center { width: 14px; height: 14px; border-radius: 50%; background: #0f172a; }

.vinyl-arm {
  position: absolute;
  top: -12px; right: -10px;
  width: 60px; height: 100px;
  background: transparent;
  border-right: 4px solid var(--text-secondary);
  border-top: 4px solid var(--text-secondary);
  border-radius: 0 16px 0 0;
  transform-origin: 0 0;
  transform: rotate(-16deg);
  transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px; right: -4px;
    width: 10px; height: 14px;
    background: #64748b;
    border-radius: 2px;
  }
}

.vinyl-arm.is-playing { transform: rotate(14deg); }

.audio-info { margin-bottom: 24px; }
.audio-title { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); display: block; }
.audio-artist-sub { font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px; display: block; }
.premium-preview-audio { width: 100%; margin-top: 8px; border-radius: 8px; }

.visualizer-hint-pulse {
  display: flex; align-items: center; justify-content: center; margin-top: 12px; gap: 3px;
  .hint-bar {
    width: 3px; background: #10b981; border-radius: 1px;
    &.b1 { height: 10px; animation: audPulse 1.2s infinite ease-in-out; }
    &.b2 { height: 14px; animation: audPulse 0.8s infinite ease-in-out; }
    &.b3 { height: 9px; animation: audPulse 1.4s infinite ease-in-out; }
  }
}

@keyframes audPulse { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ==================== 9. 代码编辑器优化 ==================== */
.standalone-viewport-text {
  width: 90%;
  max-width: 1080px;
  height: calc(100vh - 128px);
  background: var(--code-editor-bg);
  border: 1px solid var(--code-editor-border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 15px 40px var(--shadow-color);
  transition: all 0.4s ease;
}

.preview-text-header {
  height: 52px;
  background: var(--code-editor-header);
  border-bottom: 1px solid var(--code-editor-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 12px; }
.text-format-badge {
  font-size: 0.72rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
}

.match-count-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ea580c;
  background: rgba(245, 158, 11, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
}

.header-right { display: flex; align-items: center; gap: 10px; }
.code-search-box {
  width: 170px;
  
  :deep(.el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.03) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: none !important;
    border-radius: 6px;
    
    .el-input__inner { color: var(--text-primary); font-size: 0.75rem; }
  }
}

.dark-theme .code-search-box :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.2) !important;
}

.preview-text-editor {
  flex: 1;
  display: flex;
  overflow-y: auto;
  font-family: "Fira Code", Consolas, Monaco, monospace;
  font-size: 0.85rem;
  line-height: 1.65;
  background: var(--code-editor-bg);
}

.editor-line-numbers {
  width: 52px;
  background: var(--code-editor-numbers);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 16px 12px 16px 0;
  color: var(--code-number-text);
  user-select: none;
}

.editor-content {
  flex: 1;
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
  color: var(--code-text);
  white-space: pre;
  background: transparent;
  
  &.wrap-lines {
    white-space: pre-wrap;
    word-break: break-all;
  }
}

:deep(.code-search-highlight) {
  background-color: #f59e0b !important;
  color: #000000 !important;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  font-weight: 700;
  border-radius: 2px;
}

/* ==================== ☀️ 白天模式高亮样式极佳重写 ==================== */
.light-theme {
  .editor-content {
    color: #24292e !important;
    :deep(.hljs-keyword) { color: #d73a49 !important; font-weight: 700; }
    :deep(.hljs-string) { color: #032f62 !important; }
    :deep(.hljs-number) { color: #005cc5 !important; }
    :deep(.hljs-comment) { color: #6a737d !important; font-style: italic; }
    :deep(.hljs-title) { color: #6f42c1 !important; font-weight: 700; }
    :deep(.hljs-attr) { color: #e36209 !important; }
    :deep(.hljs-built_in) { color: #e36209 !important; }
  }
  
  .standalone-viewport-markdown :deep(.markdown-body pre code.hljs) {
    color: #24292e !important;
    .hljs-keyword { color: #d73a49 !important; font-weight: 700; }
    .hljs-string { color: #032f62 !important; }
    .hljs-number { color: #005cc5 !important; }
    .hljs-comment { color: #6a737d !important; font-style: italic; }
    .hljs-title { color: #6f42c1 !important; }
    .hljs-attr { color: #e36209 !important; }
  }
}

/* ==================== 10. 未知探索卡片 ==================== */
.preview-unsupported { text-align: center; color: var(--text-secondary); }
.unsupported-space-orbit {
  position: relative;
  width: 90px; height: 90px;
  margin: 0 auto 24px;
  display: flex; align-items: center; justify-content: center;
}

.space-center-badge {
  background: var(--btn-bg);
  padding: 18px;
  border-radius: 50%;
  color: var(--text-muted);
  z-index: 2;
}

.unsupported-svg-glow { filter: drop-shadow(0 0 6px var(--neon-glow)); }

.orbit-ring {
  position: absolute;
  border: 1px dashed var(--border-color);
  border-radius: 50%;
  z-index: 1;
  &.r1 { width: 100%; height: 100%; animation: rotOrbit 12s linear infinite; }
  &.r2 {
    width: 130%; height: 130%;
    border-color: rgba(37, 99, 235, 0.12);
    animation: rotOrbit 20s linear infinite reverse;
  }
}

.dark-theme .orbit-ring.r2 {
  border-color: rgba(56, 189, 248, 0.15);
}

@keyframes rotOrbit { to { transform: rotate(360deg); } }

.unsupported-title { font-size: 1.0rem; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }

.unsupported-meta-panel {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 20px;
  text-align: left;
  
  .meta-row {
    display: flex; justify-content: space-between; font-size: 0.76rem;
    padding: 5px 0; border-bottom: 1px solid var(--border-light);
    &:last-child { border-bottom: none; }
  }
  .m-label { color: var(--text-secondary); }
  .m-val {
    color: var(--text-primary); font-weight: 700; max-width: 250px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .font-code { font-family: monospace; color: #0284c7; }
}

.dark-theme .unsupported-meta-panel {
  background: rgba(0, 0, 0, 0.2);
  .font-code { color: #38bdf8; }
}

.unsupported-desc { font-size: 0.8rem; line-height: 1.6; }
.unsupported-qrcode-section { margin-top: 20px; display: flex; justify-content: center; }

.mock-qrcode-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
  width: 130px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  
  .qrcode-text { font-size: 0.68rem; color: var(--text-secondary); font-weight: 600; }
}

.qrcode-grid {
  width: 80px; height: 80px;
  background: #ffffff;
  border-radius: 4px;
  position: relative;
  padding: 6px;
  
  .q-corner {
    position: absolute;
    width: 16px; height: 16px;
    border: 3.5px solid #0f172a;
    &.qt-left { top: 6px; left: 6px; }
    &.qt-right { top: 6px; right: 6px; }
    &.qb-left { bottom: 6px; left: 6px; }
  }
  .q-matrix {
    width: 100%; height: 100%;
    background-image: radial-gradient(#0f172a 25%, transparent 25%);
    background-size: 7px 7px;
    opacity: 0.85;
  }
}

/* ==================== 极细 Mac 风格视网膜冷蓝滚动条 ==================== */
::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
}
::-webkit-scrollbar-track {
  background: transparent !important;
}
::-webkit-scrollbar-thumb {
  background: rgba(37, 99, 235, 0.25) !important;
  border-radius: 99px !important;
  transition: background 0.3s ease !important;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(37, 99, 235, 0.65) !important;
}
</style>
