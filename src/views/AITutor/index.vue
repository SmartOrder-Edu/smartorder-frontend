<template>
  <AppLayout>
    <div class="ai-tutor-page">
      <!-- 对话上下文选择器 -->
      <div class="context-switcher">
        <span class="context-label">当前对话范围：</span>
        <div class="context-chips">
          <button
            v-for="ctx in contextOptions"
            :key="ctx.id"
            class="context-chip"
            :class="{ active: activeContext === ctx.id }"
            @click="switchContext(ctx.id)"
          >
            <span class="chip-dot" :style="{ background: ctx.color }"></span>
            {{ ctx.label }}
          </button>
        </div>
      </div>

      <div class="tutor-container">
        <!-- 左侧：历史会话侧边栏 -->
        <aside class="history-sidebar" :class="{ open: historySidebarOpen }">
          <div class="history-sidebar-header">
            <span class="history-sidebar-title">对话历史</span>
            <button class="new-chat-btn-sidebar" @click="handleNewChat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新对话
            </button>
          </div>
          <div class="history-sidebar-list">
            <div class="history-loading" v-if="agentStore.conversationsLoading">加载中...</div>
            <div class="history-empty" v-else-if="agentStore.conversations.length === 0">
              <p class="empty-text">暂无对话记录</p>
              <p class="empty-hint">发送一条消息开始对话</p>
            </div>
            <div
              v-for="conv in agentStore.conversations"
              :key="conv.conversationId"
              class="history-item"
              :class="{ active: conv.conversationId === agentStore.currentConversationId }"
              @click="loadConversationFromSidebar(conv)"
            >
              <div class="history-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="history-info">
                <span class="history-title">{{ conv.title || '未命名对话' }}</span>
                <span class="history-date">{{ formatDate(conv.lastActiveTime) }}</span>
              </div>
              <span class="history-count" v-if="conv.messageCount > 0">{{ conv.messageCount }}</span>
              <button
                class="history-delete-btn"
                title="删除对话"
                @click.stop="handleDeleteConversation(conv)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <!-- 聊天区域 -->
        <main class="chat-area" :class="{ 'sidebar-open': historySidebarOpen }">
          <div class="chat-area-top-bar">
            <button class="history-toggle-btn" @click="historySidebarOpen = !historySidebarOpen" :title="historySidebarOpen ? '收起历史' : '展开历史'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span class="current-conv-title" v-if="currentConvTitle">{{ currentConvTitle }}</span>
          </div>
            <div class="chat-flow" ref="chatFlowRef">
              <div class="chat-flow-inner">
            <div class="chat-messages" ref="chatContainer" v-loading="loadingHistory">
            <!-- 目标规划执行面板：会话级唯一状态区，不再作为普通聊天消息重复出现 -->
            <div
              class="planning-execution-shelf"
              v-if="agentStore.currentTaskList && !agentStore.showLearningPlanPreview"
            >
              <TaskExecutionPanel
                :task-list="agentStore.currentTaskList"
                :task-execution-map="agentStore.taskExecutionMap"
                :pause-info="agentStore.planPauseInfo"
                :confirming="agentStore.planConfirmLoading"
                :live-reasoning-segments="agentStore.reasoningSegments"
                :is-current-active="true"
                :gate-submitting="gateSubmitting"
                :show-gate-card="false"
                collapsible
                default-collapsed
                @confirm="cancelAutoConfirm(); confirmPlan(agentStore.currentDraftId)"
                @gate-answer="handleGateAnswer"
                @gate-confirm="handleGateConfirm"
                @gate-cancel="handleGateCancel"
              />
            </div>

            <!-- 欢迎消息 -->
            <div class="welcome-message" v-if="messages.length === 0 && !agentStore.loading">
              <div class="welcome-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="welcome-content">
                <h3>{{ greetingText }}</h3>
                <p class="welcome-summary">
                  我正在管理你的 <strong>{{ learningSpaceCount }} 个学习空间</strong>。今天你预计可用 <strong>{{ todayAvailableHours }}</strong>。
                  {{ todayFocusText }}
                </p>
                <div class="welcome-features">
                  <div class="feature-item" v-for="f in welcomeFeatures" :key="f.label" @click="sendQuickMessage(f.label)">
                    <span class="feature-icon" v-html="f.icon"></span>
                    <span>{{ f.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-wrapper"
              :class="msg.role"
            >
              <div class="message-avatar">
                <svg v-if="msg.role === 'ai'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="{ 'user-bubble': msg.role === 'user' }">
                  <!-- 思考与工具调用过程（默认折叠） -->
                  <ReasoningProcess
                    v-if="msg.role === 'ai' && hasReasoningContent(msg)"
                    :segments="msg.reasoningSegments || []"
                    :thinking-text="msg.thinkingText || ''"
                    :tool-calls="msg.toolCalls || []"
                    :streaming="false"
                    :duration-ms="msg.thinkingDurationMs || null"
                  />
                  <!-- 网络搜索来源卡片 -->
                  <WebSearchSources
                    v-if="msg.role === 'ai' && msg.webSearchReferences?.length"
                    :references="msg.webSearchReferences"
                  />
                  <!-- AI 消息使用 Markdown 渲染 -->
                  <MarkdownRenderer v-if="msg.role === 'ai'" :content="msg.content" />
                  <!-- 思维导图卡片（历史消息） -->
                  <template v-if="msg.role === 'ai' && msg.mindMaps?.length">
                    <MindMapCard
                      v-for="(mm, idx) in msg.mindMaps"
                      :key="'mm-' + idx"
                      :data="mm"
                    />
                  </template>
                  <template v-else>
                    <p class="message-text">{{ msg.content }}</p>
                    <div v-if="msg.attachmentFileIds?.length" class="message-attachment-hint">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                      <span>{{ msg.attachmentFileIds.length }}个附件</span>
                    </div>
                  </template>

                  <!-- 资源卡片 -->
                  <div v-if="msg.resources" class="message-resources">
                    <div
                      v-for="res in msg.resources"
                      :key="res.title"
                      class="resource-card-mini"
                    >
                      <span class="res-icon">{{ res.type }}</span>
                      <div class="res-info">
                        <span class="res-title">{{ res.title }}</span>
                        <span class="res-meta">{{ res.minutes }}分钟</span>
                      </div>
                      <button class="res-open-btn">打开</button>
                    </div>
                  </div>

                  <!-- 代码块（向后兼容旧数据结构） -->
                  <pre v-if="msg.code" class="message-code"><code>{{ msg.code }}</code></pre>
                </div>

                <!-- 操作按钮 -->
                <div class="message-actions" v-if="msg.role === 'ai'">
                  <button class="msg-action-btn" @click="copyMessage(msg.content)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    {{ copiedIndex === index ? '已复制' : '复制' }}
                  </button>
                  <button
                    class="msg-action-btn trace-btn"
                    v-if="msg.traceId && hasTraceEventsForMsg(msg)"
                    @click="openMsgTrace(msg)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
                    </svg>
                    查看详细执行过程
                  </button>
                </div>

                <!-- 计划创建卡片（LEGACY 模式） -->
                <PlanCreatedCard v-if="msg.planSummary" :plan="msg.planSummary" />

                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </div>

            <!-- 流式加载指示器 -->
            <div class="message-wrapper ai loading-wrapper" v-if="agentStore.loading">
              <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  <!-- 阶段指示器 -->
                  <div v-if="agentStore.currentPhase === 'PLANNING' && !agentStore.currentTaskList" class="phase-indicator">
                    <span class="phase-spinner"></span>
                    <span class="phase-label">正在分析目标并生成任务计划...</span>
                  </div>
                  <!-- 思考与工具调用过程（流式，自动展开） -->
                  <ReasoningProcess
                    v-if="hasLiveReasoningContent()"
                    :segments="agentStore.reasoningSegments"
                    :thinking-text="agentStore.thinkingText"
                    :tool-calls="agentStore.toolCalls"
                    :streaming="true"
                  />
                  <!-- 网络搜索来源卡片（流式实时展示） -->
                  <WebSearchSources
                    v-if="agentStore.currentWebSearchReferences?.length"
                    :references="agentStore.currentWebSearchReferences"
                  />
                  <!-- 回答内容（流式） -->
                  <MarkdownRenderer v-if="agentStore.answerText" :content="agentStore.answerText" />
                  <span class="streaming-cursor" v-if="agentStore.answerText && agentStore.loading"></span>
                  <!-- 思维导图卡片（流式实时展示） -->
                  <template v-if="agentStore.currentMindMaps?.length">
                    <MindMapCard
                      v-for="(mm, idx) in agentStore.currentMindMaps"
                      :key="'mm-live-' + idx"
                      :data="mm"
                    />
                  </template>

                  <!-- 学习计划预览（LEARNING_PLAN 草稿审阅） -->
                  <LearningPlanPreview
                    v-if="agentStore.learningPlanDraft && agentStore.showLearningPlanPreview"
                    :learning-plan="agentStore.learningPlanDraft"
                    :confirming="agentStore.planConfirmLoading"
                    :readonly="agentStore.learningPlanPreviewReadonly"
                    :space-created="agentStore.learningPlanSpaceCreated"
                    @confirm="cancelAutoConfirm(); confirmPlan(agentStore.learningPlanDraft?.draftId || '')"
                    @cancel="handleLearningPlanCancel"
                  />

                  <!-- 仅有 loading dots 的情况（还没有任何思考/工具/回答） -->
                  <div v-if="!agentStore.reasoningSegments.length && !agentStore.thinkingText && !agentStore.toolCalls.length && !agentStore.answerText && !agentStore.currentTaskList" class="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 学习计划预览需要在 SSE 结束后继续保留，直到用户确认创建学习空间 -->
            <div
              class="message-wrapper ai learning-plan-review-wrapper"
              v-if="!agentStore.loading && agentStore.learningPlanDraft && agentStore.showLearningPlanPreview"
            >
              <div class="message-avatar"></div>
              <div class="message-content">
                <LearningPlanPreview
                  :learning-plan="agentStore.learningPlanDraft"
                  :confirming="agentStore.planConfirmLoading"
                  :readonly="agentStore.learningPlanPreviewReadonly"
                  :space-created="agentStore.learningPlanSpaceCreated"
                  @confirm="cancelAutoConfirm(); confirmPlan(agentStore.learningPlanDraft?.draftId || '')"
                  @cancel="handleLearningPlanCancel"
                />
              </div>
            </div>

            <div
              class="message-wrapper ai clarification-reply-wrapper"
              v-if="!agentStore.loading && clarificationPauseInfo"
            >
              <div class="message-avatar"></div>
              <div class="message-content">
                <GateCard
                  reason="CLARIFICATION"
                  :question="clarificationPauseInfo.question"
                  :clarification="clarificationPauseInfo.clarification"
                  :submitting="gateSubmitting"
                  @answer="(clarificationId: string, answer: string) => handleGateAnswer(clarificationId, answer)"
                />
              </div>
            </div>
          </div>
              </div>
          </div>

          <!-- 底部输入 -->
          <div class="chat-input-area">
            <div class="chat-flow-inner">
            <div class="input-composer">
              <div class="composer-toolbar">
                <button class="toolbar-btn" @click="handleUploadClick" title="上传文件">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                  <span>上传</span>
                </button>
                <input
                  ref="fileInputRef"
                  class="hidden-file-input"
                  type="file"
                  multiple
                  @change="handleFileSelected"
                />
                <button class="toolbar-btn" @click="handleContextClick" title="设置上下文（即将上线）">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  <span>上下文</span>
                </button>
              </div>
              <div class="attachment-strip" v-if="attachments.length || uploadProgress.status !== 'idle'">
                <div class="attachment-chip uploading" v-if="uploadProgress.status !== 'idle' && uploadProgress.status !== 'success'">
                  <span class="attachment-name">{{ uploadProgress.statusText || '正在上传附件...' }}</span>
                  <span class="attachment-status">{{ uploadProgress.percentage }}%</span>
                </div>
                <div
                  v-for="att in attachments"
                  :key="att.fileId"
                  class="attachment-chip"
                  :class="att.status"
                >
                  <span class="attachment-name">{{ att.fileName }}</span>
                  <span class="attachment-status">{{ attachmentStatusLabel(att) }}</span>
                  <button class="attachment-remove" @click="removeAttachment(att)" title="移除附件">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="mode-selector">
                <button
                  class="mode-btn"
                  :class="{ active: currentMode === 'REACT' }"
                  @click="switchMode('REACT')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <polyline points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                  </svg>
                  <span>快速回答</span>
                </button>
                <button
                  class="mode-btn"
                  :class="{ active: currentMode === 'PLAN_AND_EXECUTE' }"
                  @click="switchMode('PLAN_AND_EXECUTE')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="8,12 11,15 16,9"/>
                  </svg>
                  <span>目标规划</span>
                </button>
              </div>
              <div class="composer-body">
                <textarea
                  v-model="inputMessage"
                  :placeholder="inputPlaceholder"
                  rows="1"
                  @keydown.enter.exact.prevent="sendMessage"
                  @keydown.enter.shift.exact.stop
                  @input="autoResize"
                  ref="inputRef"
                ></textarea>
                <div class="composer-actions">
                  <button
                    v-if="agentStore.loading"
                    class="action-btn stop-action"
                    @click="handleStopGeneration"
                    title="停止生成"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  </button>
                  <button v-else class="action-btn send-action" :class="{ active: inputMessage.trim() }" :disabled="!inputMessage.trim()" @click="sendMessage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="composer-footer">
                <span class="footer-tip">Enter 发送 · Shift+Enter 换行</span>
                <div class="footer-hints">
                  <span
                    v-for="hint in quickHints"
                    :key="hint"
                    class="hint-chip"
                    @click="sendQuickMessage(hint)"
                  >
                    {{ hint }}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </main>

        <!-- 右侧：快捷工具 + 任务执行面板 -->
        <aside class="tutor-sidebar">
          <!-- 知识库引用选择与展示区 -->
          <div class="sidebar-section">
            <h3 class="section-title">知识库引用</h3>

            <!-- RAG 选择器 -->
            <div class="rag-selector-container">
              <RagReferenceSelector v-model="selectedReferences" />
            </div>

            <!-- 已选引用列表 -->
            <div class="references-list-wrapper" v-if="selectedReferences.length > 0">
              <div class="references-list">
                <div
                  v-for="ref in selectedReferences"
                  :key="ref.id"
                  class="reference-item"
                  :class="'ref-' + ref.type"
                >
                  <div class="ref-icon">
                    <svg v-if="ref.type === 'kb'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <div class="ref-info">
                    <span class="ref-name">{{ ref.name }}</span>
                    <span class="ref-meta" v-if="ref.kbName">
                      所属知识库：{{ ref.kbName }}
                    </span>
                  </div>
                  <button class="ref-remove-btn" @click="removeReference(ref)" title="移除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 清空按钮 -->
              <button class="clear-all-btn-bottom" @click="confirmClearAll">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                清空所有引用
              </button>
            </div>

            <!-- 空状态提示 -->
            <div class="empty-references" v-else>
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <p class="empty-text">暂无知识库引用</p>
              <p class="empty-hint">点击上方按钮选择知识库或文件</p>
            </div>
          </div>

          <div class="sidebar-section">
            <h3 class="section-title">快捷工具</h3>
            <div class="tools-grid">
              <button
                v-for="tool in quickTools"
                :key="tool.id"
                class="tool-card"
                @click="sendQuickMessage(tool.prompt)"
              >
                <span class="tool-icon" v-html="tool.icon"></span>
                <span class="tool-label">{{ tool.label }}</span>
                <span class="tool-desc">{{ tool.desc }}</span>
              </button>
            </div>
          </div>

        </aside>
      </div>
      <!-- 移动端历史侧边栏遮罩 -->
      <div class="history-overlay" v-if="historySidebarOpen && isMobile" @click="historySidebarOpen = false"></div>
    </div>
    <!-- 追踪面板（抽屉式） -->
    <AgentTracePanel />

    <!-- 学习蓝图揭幕面板（LEGACY 模式） -->
    <PlanRevealOverlay
      :visible="agentStore.planDialogVisible && !agentStore.currentTaskList"
      :plan="agentStore.currentPlan"
      :draft-id="agentStore.currentDraftId"
      :loading="agentStore.planConfirmLoading"
      :execution-steps="agentStore.executionSteps"
      @confirm="confirmPlan"
      @cancel="cancelPlan"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAgentChat, type ChatMessage } from '@/composables/useAgentChat'
import { useAgentStore } from '@/stores/agent'
import type { ConversationVO } from '@/api/agent'
import { agentApi } from '@/api/agent'
import { agentAttachmentApi, type AttachmentStatus } from '@/api/agentAttachment'
import type { AgentTraceEvent, ReasoningSegment } from '@/stores/agent'
import type { TaskList } from '@/types/planExecute'
import PlanCreatedCard from '@/components/agent/PlanCreatedCard.vue'
import ReasoningProcess from '@/components/agent/ReasoningProcess.vue'
import AgentTracePanel from '@/components/AgentTracePanel.vue'
import PlanRevealOverlay from '@/components/plan/PlanRevealOverlay.vue'
import TaskExecutionPanel from '@/components/plan/TaskExecutionPanel.vue'
import GateCard from '@/components/plan/GateCard.vue'
import LearningPlanPreview from '@/components/plan/LearningPlanPreview.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import WebSearchSources from '@/components/agent/WebSearchSources.vue'
import MindMapCard from '@/components/agent/MindMapCard.vue'
import { useWindowSize } from '@/composables/useWindowSize'
import { useAgentAttachmentUpload } from '@/composables/useAgentAttachmentUpload'
import RagReferenceSelector from '@/components/agent/RagReferenceSelector.vue'
import type { RagReference } from '@/composables/useAgentChat'

const userStore = useUserStore()
const agentStore = useAgentStore()

const inputMessage = ref('')
const chatContainer = ref<HTMLElement>()
const chatFlowRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const activeContext = ref('global')
const historySidebarOpen = ref(false)
const copiedIndex = ref<number | null>(null)
const attachments = ref<AttachmentStatus[]>([])
const pollingTimers = new Map<number, number>()
const { upload: uploadAttachment, uploadProgress, resetProgress } = useAgentAttachmentUpload()
const selectedReferences = ref<RagReference[]>([])

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const currentConvTitle = computed(() => {
  if (!agentStore.currentConversationId) return ''
  const conv = agentStore.conversations.find(
    c => c.conversationId === agentStore.currentConversationId
  )
  return conv?.title || ''
})

const scrollToBottom = () => {
  nextTick(() => {
    if (chatFlowRef.value) {
      chatFlowRef.value.scrollTop = chatFlowRef.value.scrollHeight
    }
  })
}

const {
  messages,
  loadingHistory,
  currentForceMode,
  sendMessage: agentSend,
  stopGeneration,
  confirmPlan,
  cancelPlan,
  loadConversation,
  startNewConversation,
  deleteConversation,
  answerClarificationViaSSE,
  confirmGateViaSSE,
} = useAgentChat(scrollToBottom)

// 用户手动选择的对话模式
const currentMode = ref<'REACT' | 'PLAN_AND_EXECUTE'>('REACT')

const switchMode = (mode: 'REACT' | 'PLAN_AND_EXECUTE') => {
  currentMode.value = mode
  currentForceMode.value = mode
}

const contextOptions = ref([
  { id: 'global', label: '全局学习', color: '#6b7280' },
  { id: 'math', label: '高等数学', color: '#3b82f6' },
  { id: 'english', label: '英语四级', color: '#10b981' },
  { id: 'se', label: '软件工程', color: '#f59e0b' },
  { id: 'os', label: '操作系统', color: '#8b5cf6' }
])

const switchContext = (ctxId: string) => {
  activeContext.value = ctxId
  const ctx = contextOptions.value.find(c => c.id === ctxId)
  if (ctxId === 'global') {
    ElMessage.success('已切换到全局学习上下文。总 Agent 将为你统筹所有学习空间。')
  } else if (ctx) {
    ElMessage.success(`已切换到"${ctx.label}"学习空间。空间 Agent 将专注于该领域的解答。`)
  }
}

const greetingText = computed(() => {
  const hour = new Date().getHours()
  const name = userStore.userName || '同学'
  let timeGreeting = ''
  if (hour < 6) timeGreeting = '夜深了'
  else if (hour < 12) timeGreeting = '早上好'
  else if (hour < 14) timeGreeting = '中午好'
  else if (hour < 18) timeGreeting = '下午好'
  else timeGreeting = '晚上好'
  return `${timeGreeting}，${name}。我是你的 AI 学习伙伴`
})

// 动态欢迎数据（后续接入 API 后可实时更新）
const learningSpaceCount = computed(() => {
  // TODO: 从 learningSpace store 获取真实数量
  return 4
})
const todayAvailableHours = computed(() => {
  // TODO: 从每日计划 API 获取真实数据
  return '2小时30分钟'
})
const todayFocusText = computed(() => {
  // TODO: 从学习计划 API 获取真实重点
  return '高等数学和软件工程今天是重点，操作系统昨天已完成复习可以暂缓。'
})

const welcomeFeatures = [
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '解释知识点'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    label: '生成练习题'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    label: '生成思维导图'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    label: '整理学习笔记'
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    label: '分析薄弱点'
  }
]

const inputPlaceholder = computed(() =>
  currentMode.value === 'PLAN_AND_EXECUTE'
    ? '描述你的学习目标，AI 将为你制定学习路径和计划…'
    : '输入你的问题，AI 会结合你的学习画像给出个性化回答…'
)

const gateSubmitting = ref(false)

const clarificationPauseInfo = computed(() => {
  if (agentStore.showLearningPlanPreview) return null
  const pauseInfo = agentStore.planPauseInfo
  if (!pauseInfo || pauseInfo.reason !== 'CLARIFICATION') return null
  return pauseInfo
})

// 当暂停状态变化（next question / resumed）时，重置 submitting
watch(() => agentStore.planPauseInfo?.clarification?.clarificationId, () => {
  gateSubmitting.value = false
})

const quickHints = computed(() =>
  currentMode.value === 'PLAN_AND_EXECUTE'
    ? [
        '帮我制定操作系统复习计划',
        '帮我规划考研408备考方案',
        '制定英语六级备考计划',
        '帮我拆解软件工程项目任务',
        '帮我安排计算机基础学习路径',
      ]
    : [
        '帮我制定一个学习计划',
        '我今天应该重点学什么？',
        '生成一组洛必达法则的练习题',
        '软件工程项目帮我拆一下任务',
        '帮我分析最近的薄弱点',
      ]
)

const quickTools = [
  {
    id: 1,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '知识讲解',
    desc: '深入讲解概念',
    prompt: '请详细讲解进程和线程的区别，包括它们的定义、特点、优缺点和使用场景'
  },
  {
    id: 2,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    label: '生成练习',
    desc: '针对薄弱点',
    prompt: '请根据我的学习记录，生成10道关于进程同步与互斥的专项练习题'
  },
  {
    id: 3,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><line x1="12" y1="9" x2="12" y2="3"/></svg>',
    label: '思维导图',
    desc: '知识可视化',
    prompt: '请为我生成一份"操作系统进程管理"的知识思维导图'
  },
  {
    id: 4,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
    label: '整理笔记',
    desc: '自动归纳',
    prompt: '请根据我们之前的对话，帮我整理一份"线程同步"的学习笔记'
  },
  {
    id: 5,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    label: '薄弱分析',
    desc: '智能诊断',
    prompt: '分析我在"进程同步与互斥"这个章节的薄弱点，给出针对性的学习建议'
  },
  {
    id: 6,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    label: '代码示例',
    desc: '代码辅助',
    prompt: '请给我一个用Python实现哲学家就餐问题的代码示例，并加上详细注释'
  }
]

const autoResize = () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 160) + 'px'
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || agentStore.loading) return
  if (attachments.value.some(a => a.status === 'processing' || a.status === 'uploading')) {
    ElMessage.warning('附件仍在解析中，请稍后再提问')
    return
  }
  const msg = inputMessage.value
  inputMessage.value = ''

  // PAUSED_CLARIFICATION 态走专用澄清接口（有 draftId 和 clarificationId）
  const pausedClarId = agentStore.planPauseInfo?.clarification?.clarificationId
  if (!agentStore.showLearningPlanPreview
      && agentStore.planPauseInfo?.reason === 'CLARIFICATION'
      && agentStore.currentTaskList?.status === 'PAUSED_CLARIFICATION'
      && agentStore.currentDraftId
      && pausedClarId) {
    gateSubmitting.value = true
    try {
      await answerClarificationViaSSE(agentStore.currentDraftId, pausedClarId, msg)
    } finally {
      gateSubmitting.value = false
    }
    return
  }

  // 从 ready 附件构造 RagReference 列表
  const attachmentRefs: RagReference[] = attachments.value
    .filter(a => a.status === 'ready')
    .map(a => ({
      id: String(a.fileId),
      name: a.fileName,
      type: 'file' as const,
    }))
  // 合并附件引用和知识库引用（去重）
  const existingIds = new Set(attachmentRefs.map(r => r.id))
  const uniqueSelectedRefs = selectedReferences.value.filter(r => !existingIds.has(r.id))
  const allRefs = [...attachmentRefs, ...uniqueSelectedRefs]
  await agentSend(msg, allRefs.length > 0 ? allRefs : undefined)
}

const sendQuickMessage = (msg: string) => {
  inputMessage.value = msg
  sendMessage()
}

const handleNewChat = async () => {
  startNewConversation()
  clearAttachmentState()
  await agentStore.fetchConversations()
}

const handleStopGeneration = () => {
  stopGeneration()
}

const handleDeleteConversation = async (conv: ConversationVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除对话"${conv.title || '未命名对话'}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    await deleteConversation(conv.conversationId)
    ElMessage.success('对话已删除')
    await agentStore.fetchConversations()
  } catch {
    ElMessage.error('删除失败，请重试')
  }
}

const readyAttachmentIds = computed(() => {
  return attachments.value
    .filter(att => att.status === 'ready')
    .map(att => att.fileId)
})

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return

  for (const file of files) {
    try {
      const result = await uploadAttachment(file, agentStore.currentConversationId || undefined)
      if (result.conversationId && !agentStore.currentConversationId) {
        agentStore.currentConversationId = result.conversationId
      }
      if (result.fileId) {
        upsertAttachment({
          conversationId: result.conversationId,
          fileId: result.fileId,
          jobId: result.jobId,
          fileName: result.fileName || file.name,
          fileSize: file.size,
          status: result.status || 'processing',
          parseStatus: result.parseStatus,
          chunkStatus: result.chunkStatus,
          embeddingStatus: result.embeddingStatus,
          progress: result.progress,
          currentStep: result.currentStep,
          errorMessage: result.errorMessage,
        })
        startAttachmentPolling(result.conversationId, result.fileId)
      }
      ElMessage.success(`${file.name} 已上传，正在解析`)
    } catch (error: any) {
      ElMessage.error(error?.message || `${file.name} 上传失败`)
    }
  }
  setTimeout(resetProgress, 800)
}

const upsertAttachment = (attachment: AttachmentStatus) => {
  const index = attachments.value.findIndex(att => att.fileId === attachment.fileId)
  if (index >= 0) {
    attachments.value[index] = { ...attachments.value[index], ...attachment }
  } else {
    attachments.value.push(attachment)
  }
}

const startAttachmentPolling = (conversationId: string, fileId: number) => {
  if (pollingTimers.has(fileId)) {
    window.clearInterval(pollingTimers.get(fileId))
  }
  const poll = async () => {
    try {
      const status = await agentAttachmentApi.getStatus(conversationId, fileId)
      upsertAttachment(status)
      if (status.status === 'ready' || status.status === 'failed' || status.status === 'deleted') {
        const timer = pollingTimers.get(fileId)
        if (timer) {
          window.clearInterval(timer)
          pollingTimers.delete(fileId)
        }
      }
    } catch (e) {
      console.warn('[AITutor] 附件状态轮询失败:', e)
    }
  }
  poll()
  pollingTimers.set(fileId, window.setInterval(poll, 2500))
}

const loadConversationAttachments = async (conversationId: string) => {
  try {
    const list = await agentAttachmentApi.list(conversationId)
    attachments.value = list || []
    attachments.value
      .filter(att => att.status === 'processing' || att.status === 'uploading')
      .forEach(att => startAttachmentPolling(conversationId, att.fileId))
  } catch (e) {
    console.warn('[AITutor] 加载附件失败:', e)
    attachments.value = []
  }
}

const removeAttachment = async (attachment: AttachmentStatus) => {
  try {
    await agentAttachmentApi.remove(attachment.conversationId, attachment.fileId)
    attachments.value = attachments.value.filter(att => att.fileId !== attachment.fileId)
    const timer = pollingTimers.get(attachment.fileId)
    if (timer) {
      window.clearInterval(timer)
      pollingTimers.delete(attachment.fileId)
    }
  } catch {
    ElMessage.error('移除附件失败，请重试')
  }
}

const attachmentStatusLabel = (attachment: AttachmentStatus) => {
  if (attachment.status === 'ready') return '可提问'
  if (attachment.status === 'failed') return '解析失败'
  if (attachment.progress != null) return `${attachment.currentStep || '解析中'} ${attachment.progress}%`
  return '解析中'
}

const clearAttachmentState = () => {
  for (const timer of pollingTimers.values()) {
    window.clearInterval(timer)
  }
  pollingTimers.clear()
  attachments.value = []
  resetProgress()
}

const handleContextClick = () => {
  ElMessage.info('上下文设置功能即将上线，敬请期待')
}

const removeReference = (ref: RagReference) => {
  selectedReferences.value = selectedReferences.value.filter(r => r.id !== ref.id)
}

const confirmClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清空所有知识库引用吗？`,
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    selectedReferences.value = []
  } catch {
    // 用户取消
  }
}

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (isoString: string) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 找到当前 AI 消息的索引
    const idx = messages.value.findLastIndex(m => m.role === 'ai' && m.content === content)
    copiedIndex.value = idx
    setTimeout(() => { copiedIndex.value = null }, 2000)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const loadConversationFromSidebar = async (conv: ConversationVO) => {
  await loadConversation(conv.conversationId)
  await loadConversationAttachments(conv.conversationId)
  if (isMobile.value) {
    historySidebarOpen.value = false
  }
}

const hasTraceEventsForMsg = (msg: any): boolean => {
  return !!(msg.traceEvents?.length) || !!msg.traceId
}

/** 判断消息是否包含推理过程（思考或工具调用） */
function hasReasoningContent(msg: ChatMessage): boolean {
  return !!(
    msg.reasoningSegments?.length ||
    msg.thinkingText ||
    msg.toolCalls?.length
  )
}

/** 判断当前流式状态是否有推理内容 */
function hasLiveReasoningContent(): boolean {
  return !!(
    agentStore.reasoningSegments.length ||
    agentStore.thinkingText ||
    agentStore.toolCalls.length
  )
}

/** 取消自动执行倒计时 */
function cancelAutoConfirm() {
  if (autoConfirmTimer) {
    clearInterval(autoConfirmTimer)
    autoConfirmTimer = null
  }
  autoConfirmCountdown.value = 0
  autoConfirmPending.value = false
}

const openMsgTrace = async (msg: any) => {
  if (msg.traceEvents?.length) {
    agentStore.traceEvents = injectThinkEventIfMissing(msg.traceEvents, msg.thinkingText, msg.reasoningSegments)
  } else if (msg.traceId) {
    try {
      const rawEvents: any[] = await agentApi.getTraceEvents(msg.traceId)
      // 标准化后端实体格式 → 前端 AgentTraceEvent 格式
      const normalized = (rawEvents || []).map((raw: any) => {
        let payload = raw.payload
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload) } catch { /* keep as string */ }
        }
        return {
          traceId: raw.traceId || '',
          conversationId: raw.conversationId || '',
          userId: raw.userId || 0,
          mode: raw.agentMode || raw.mode || '',
          eventType: raw.eventType || '',
          seq: raw.sequenceNum || raw.seq || 0,
          timestamp: raw.createTime ? new Date(raw.createTime).getTime() : (raw.timestamp || Date.now()),
          payload,
        }
      })
      const enriched = injectThinkEventIfMissing(normalized, msg.thinkingText, msg.reasoningSegments)
      agentStore.traceEvents = enriched
      msg.traceEvents = enriched // 缓存（含合成 think 事件）
    } catch (e) {
      console.error('[AITutor] 获取 trace 失败:', e)
      agentStore.traceEvents = []
    }
  }
  agentStore.openTracePanel(msg.traceId)
}

// === Plan-and-Execute Gate 事件处理 ===

const handleGateAnswer = async (clarificationId: string, answer: string) => {
  const draftId = agentStore.currentDraftId
  if (clarificationId && draftId) {
    gateSubmitting.value = true
    try {
      await answerClarificationViaSSE(draftId, clarificationId, answer)
    } finally {
      gateSubmitting.value = false
    }
  } else {
    // 回退：尝试从 store 取 active clarificationId
    const sid = agentStore.planPauseInfo?.clarification?.clarificationId
    if (sid && draftId) {
      gateSubmitting.value = true
      try {
        await answerClarificationViaSSE(draftId, sid, answer)
      } finally {
        gateSubmitting.value = false
      }
    } else {
      // 最后回退：普通聊天路径
      agentSend(answer, [])
    }
  }
}

const handleGateConfirm = (taskId: string) => {
  // 区分 CONFIRMATION gate 和 LEARNING_PLAN / DRAFT 确认
  const draftId = agentStore.currentDraftId
  const taskList = agentStore.currentTaskList
  if (taskList?.status === 'PAUSED_CONFIRMATION' && draftId) {
    // CONFIRMATION gate：使用专用 API
    confirmGateViaSSE(draftId)
  } else {
    // LEARNING_PLAN / DRAFT / PENDING_CONFIRM：走原有 plan/confirm
    confirmPlan(draftId)
  }
}

const handleGateCancel = (_taskId: string) => {
  // 取消执行
  cancelPlan()
}

/** 取消学习计划预览，清空相关状态 */
const handleLearningPlanCancel = () => {
  agentStore.showLearningPlanPreview = false
  agentStore.learningPlanDraft = null
  ElMessage.info('已取消，你可以重新描述学习目标')
}

/**
 * 历史 trace 中缺少 agent.think.delta（后端不持久化高频 delta 事件），
 * 导致抽屉时间线缺少"思考"节点。
 *
 * - 如果有 reasoningSegments，按段精确合成多条 think.delta 与工具事件交错
 * - 否则用 reasoningContent 合成一条虚拟事件补上（旧行为）
 */
function injectThinkEventIfMissing(
  events: AgentTraceEvent[],
  thinkingText?: string,
  reasoningSegments?: ReasoningSegment[],
): AgentTraceEvent[] {
  // 优先使用 reasoningSegments 精确重建思考与工具的交错顺序
  if (reasoningSegments?.length) {
    return interleaveThinkFromSegments(events, reasoningSegments)
  }

  if (!thinkingText || events.length === 0) return events
  const hasThinkDelta = events.some(e => e.eventType === 'agent.think.delta')
  if (hasThinkDelta) return events

  const minSeq = Math.min(...events.map(e => e.seq))
  const ref = events[0]
  const synthetic: AgentTraceEvent = {
    traceId: ref.traceId,
    conversationId: ref.conversationId,
    userId: ref.userId,
    mode: ref.mode,
    eventType: 'agent.think.delta',
    seq: Math.max(0, minSeq - 1),
    timestamp: ref.timestamp,
    payload: { text: thinkingText },
  }
  return [synthetic, ...events]
}

/**
 * 根据 reasoningSegments 在工具事件之间精确插入合成 think.delta 事件，
 * 使历史追踪面板与实时展示的思考→工具→思考交错结构完全一致。
 */
function interleaveThinkFromSegments(
  events: AgentTraceEvent[],
  segments: ReasoningSegment[],
): AgentTraceEvent[] {
  const ref = events[0]
  const result: AgentTraceEvent[] = []
  let seq = 0

  // 分类原始事件
  const preEvents: AgentTraceEvent[] = []          // trace.started, route.completed, phase.change
  const toolStartedList: AgentTraceEvent[] = []     // agent.tool.started
  const toolCompletedMap = new Map<string, AgentTraceEvent>()  // toolName → completed/failed
  const postEvents: AgentTraceEvent[] = []          // sub_agent.*, error, trace.completed

  for (const e of events) {
    switch (e.eventType) {
      case 'agent.tool.started':
        toolStartedList.push(e)
        break
      case 'agent.tool.completed':
      case 'agent.tool.failed':
        toolCompletedMap.set(e.payload?.toolName || '', e)
        break
      case 'agent.trace.started':
      case 'agent.route.completed':
      case 'agent.phase.change':
      case 'agent.status':
        preEvents.push(e)
        break
      default:
        postEvents.push(e)
        break
    }
  }

  // 1. 前置事件（路由、阶段等）
  for (const e of preEvents) {
    result.push({ ...e, seq: seq++ })
  }

  // 2. 按 segments 交错：思考 → 工具
  const usedTools = new Set<number>()

  for (const seg of segments) {
    // 思考
    if (seg.thinkingText) {
      result.push({
        traceId: ref.traceId,
        conversationId: ref.conversationId,
        userId: ref.userId,
        mode: ref.mode,
        eventType: 'agent.think.delta',
        seq: seq++,
        timestamp: ref.timestamp,
        payload: { text: seg.thinkingText },
      })
    }

    // 工具调用（按顺序匹配 toolStartedList 中第一个未使用的同名工具）
    if (seg.toolCall) {
      for (let i = 0; i < toolStartedList.length; i++) {
        if (usedTools.has(i)) continue
        const started = toolStartedList[i]
        if (started.payload?.toolName === seg.toolCall.toolName) {
          result.push({ ...started, seq: seq++ })
          usedTools.add(i)

          const completed = toolCompletedMap.get(seg.toolCall.toolName)
          if (completed) {
            result.push({ ...completed, seq: seq++ })
          }
          break
        }
      }
    }
  }

  // 3. 未匹配的工具事件（兜底）
  for (let i = 0; i < toolStartedList.length; i++) {
    if (!usedTools.has(i)) {
      result.push({ ...toolStartedList[i], seq: seq++ })
      const completed = toolCompletedMap.get(toolStartedList[i].payload?.toolName || '')
      if (completed) {
        result.push({ ...completed, seq: seq++ })
      }
    }
  }

  // 4. 后置事件（子 Agent、错误等）
  for (const e of postEvents) {
    result.push({ ...e, seq: seq++ })
  }

  return result
}

// Plan-and-Execute 自动确认（纯 NORMAL 门计划无需手动确认）
const autoConfirmPending = ref(false)
const autoConfirmCountdown = ref(0)
let autoConfirmTimer: ReturnType<typeof setInterval> | null = null

function shouldAutoConfirmTaskList(taskList: TaskList | null): boolean {
  const allNormalPending = !!taskList
    && taskList.status === 'PENDING_CONFIRM'
    && taskList.tasks.every(t => t.gate === 'NORMAL' && t.status === 'PENDING')

  return !!(
    taskList &&
    allNormalPending &&
    !agentStore.planPauseInfo &&
    !agentStore.planExecuting &&
    !agentStore.planNeedsConfirmation &&
    !agentStore.showLearningPlanPreview &&
    !agentStore.loading &&
    agentStore.currentDraftId
  )
}

// 监听 currentTaskList 变化，标记是否需要自动确认
watch(
  () => [
    agentStore.currentTaskList,
    agentStore.loading,
    agentStore.planExecuting,
    agentStore.planNeedsConfirmation,
    agentStore.showLearningPlanPreview,
    agentStore.currentDraftId,
    agentStore.planPauseInfo,
  ] as const,
  ([taskList]) => {
    // 清除上一次的定时器
    if (autoConfirmTimer) {
      clearInterval(autoConfirmTimer)
      autoConfirmTimer = null
    }
    autoConfirmCountdown.value = 0
    autoConfirmPending.value = false

    if (shouldAutoConfirmTaskList(taskList)) {
      autoConfirmPending.value = true
      autoConfirmCountdown.value = 3
      autoConfirmTimer = setInterval(() => {
        autoConfirmCountdown.value--
        if (autoConfirmCountdown.value <= 0) {
          if (autoConfirmTimer) {
            clearInterval(autoConfirmTimer)
            autoConfirmTimer = null
          }
          // 触发时再次检查所有条件，避免状态变化后确认错对象。
          if (autoConfirmPending.value && shouldAutoConfirmTaskList(agentStore.currentTaskList)) {
            autoConfirmPending.value = false
            confirmPlan(agentStore.currentDraftId)
          }
        }
      }, 1000) // 3s 倒计时，每秒减 1
    }
  },
)

onMounted(() => {
  agentStore.fetchConversations()
  if (window.innerWidth < 768) {
    historySidebarOpen.value = false
  }
})

onUnmounted(() => {
  clearAttachmentState()
  if (autoConfirmTimer) {
    clearInterval(autoConfirmTimer)
    autoConfirmTimer = null
  }
})

watch(windowWidth, (newWidth) => {
  if (newWidth < 768) {
    historySidebarOpen.value = false
  }
})
</script>

<style scoped>
.ai-tutor-page {
  max-width: 1680px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: calc(var(--spacing-xl) * -1) calc(var(--spacing-2xl) * -1) calc(var(--spacing-xl) * -1);
  padding: var(--spacing-xs) var(--spacing-2xl) 0;
}

/* 上下文选择器 */
.context-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.context-label {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.context-chips {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.context-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-light);
  background: white;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  .chip-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  &:hover { border-color: var(--primary-color); color: var(--primary-color); }

  &.active {
    background: rgba(11, 183, 170, 0.08);
    border-color: var(--primary-color);
    color: var(--primary-color);
    font-weight: 600;
  }
}

.tutor-container {
  display: grid;
  grid-template-columns: auto 1fr 280px;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 历史会话侧边栏 */
.history-sidebar {
  width: 0;
  overflow: hidden;
  opacity: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.history-sidebar.open {
  width: 260px;
  opacity: 1;
  overflow: hidden;
}

.history-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  min-height: 48px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.history-sidebar-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
}

.new-chat-btn-sidebar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-color);
  background: rgba(11, 183, 170, 0.06);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.new-chat-btn-sidebar:hover {
  background: rgba(11, 183, 170, 0.12);
}

.history-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 聊天区域 */
.chat-area {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.chat-area.sidebar-open {
  border-left: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.chat-area.sidebar-open .chat-area-top-bar {
  border-top-left-radius: 0;
}

.chat-flow {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.chat-flow::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.chat-flow::-webkit-scrollbar-track {
  background: transparent;
}

.chat-flow::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 999px;
  min-height: 8px;
}

.chat-flow::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

.chat-flow-inner {
  max-width: min(896px, 100%);
  margin: 0 auto;
  width: 100%;
}

.chat-area-top-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  min-height: 48px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  background: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.history-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
}

.history-toggle-btn:hover {
  background: var(--background-color-base);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.history-toggle-btn svg { width: 16px; height: 16px; }

.current-conv-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-messages {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.planning-execution-shelf {
  position: sticky;
  top: 0;
  z-index: 5;
  width: 100%;
  max-width: 920px;
  align-self: stretch;
  padding-bottom: 2px;
  background: linear-gradient(180deg, var(--background-color, #f8fafc) 0%, rgba(248, 250, 252, 0.88) 78%, rgba(248, 250, 252, 0) 100%);
}

.planning-execution-shelf :deep(.task-execution-panel) {
  max-height: min(48vh, 520px);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(11, 183, 170, 0.04), rgba(18, 184, 134, 0.04));
  border-radius: var(--radius-xl);
}

.welcome-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.welcome-avatar svg {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}

.welcome-content h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text-dark);
}

.welcome-content p {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.welcome-summary {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: var(--spacing-sm) 0 var(--spacing-lg);
  strong { color: var(--text-dark); font-weight: 600; }
}

.welcome-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--spacing-sm);
  background: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.75rem;
  color: var(--text-dark);
  border: 1px solid var(--border-light);
}

.feature-item:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.feature-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
.feature-icon :deep(svg) { width: 100%; height: 100%; }

/* 消息 */
.message-wrapper {
  display: flex;
  gap: var(--spacing-md);
  animation: fadeInUp 0.3s ease;
}

.message-wrapper.user {
  flex-direction: row-reverse;
}

.message-wrapper.user .message-content {
  width: fit-content;
  max-width: 50%;
}

.message-wrapper.ai .message-content {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-width: 820px;
}

.message-avatar {
  display: none;
}

.message-content {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message-bubble {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-xl);
  font-size: 0.9375rem;
}

.message-wrapper.ai .message-bubble {
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.user-bubble {
  background: rgba(11, 183, 170, 0.08);
  color: var(--text-dark);
  border-bottom-right-radius: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
}

.message-text {
  white-space: pre-wrap;
  margin: 0;
}

.message-attachment-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 12px;
  color: var(--text-secondary, #666);
  width: fit-content;
}

/* 流式光标 */
.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--primary-color);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 阶段指示器 */
.phase-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin-bottom: var(--spacing-sm);
  background: linear-gradient(135deg, rgba(18, 184, 134, 0.06), rgba(11, 183, 170, 0.04));
  border: 1px solid rgba(18, 184, 134, 0.15);
  border-radius: var(--radius-lg);
  font-size: 0.8125rem;
  color: #047857;
}

.phase-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(18, 184, 134, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.phase-label {
  font-weight: 500;
}

.message-resources {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.resource-card-mini {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.res-icon { font-size: 1rem; }
.res-info { flex: 1; display: flex; flex-direction: column; }
.res-title { font-size: 0.8125rem; color: var(--text-dark); }
.res-meta { font-size: 0.625rem; color: var(--text-muted); }

.res-open-btn {
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  cursor: pointer;
}

.message-code {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: #1e1e1e;
  border-radius: var(--radius-lg);
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.message-code code { color: #d4d4d4; white-space: pre; }

.message-actions {
  display: flex;
  gap: var(--spacing-sm);
  padding-left: var(--spacing-sm);
}

.msg-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.625rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.msg-action-btn:hover {
  background: var(--background-color-base);
  color: var(--text-secondary);
}

.message-time {
  font-size: 0.625rem;
  color: var(--text-muted);
  padding-left: var(--spacing-sm);
}

.message-wrapper.user .message-time {
  text-align: right;
  padding-left: 0;
  padding-right: var(--spacing-sm);
}

/* 内联工具调用卡片列表 */
.inline-tool-calls {
  margin-bottom: 6px;
}

/* 加载 */
.loading-bubble {
  min-width: 60px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* 输入区域 */
.chat-input-area {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
  border-top: 1px solid var(--border-light);
  background: white;
}

.input-composer {
  background: #f7f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-composer:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(11, 183, 170, 0.08);
}

/* 模式选择器 */
.mode-selector {
  display: flex;
  gap: 4px;
  padding: 6px 8px 0;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn svg {
  flex-shrink: 0;
}

.mode-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(11, 183, 170, 0.04);
}

.mode-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.mode-btn.active:hover {
  background: #0a9e94;
  border-color: #0a9e94;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px 0;
}

.hidden-file-input {
  display: none;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toolbar-btn svg { width: 14px; height: 14px; }
.toolbar-btn:hover {
  background: rgba(11, 183, 170, 0.06);
  color: var(--primary-color);
}

.attachment-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px 0;
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 28px;
  padding: 4px 6px 4px 10px;
  border-radius: 8px;
  border: 1px solid #dbe3ef;
  background: white;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.attachment-chip.ready {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.attachment-chip.processing,
.attachment-chip.uploading {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.attachment-chip.failed {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.attachment-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.attachment-status {
  color: inherit;
  opacity: 0.78;
  white-space: nowrap;
  font-size: 0.6875rem;
}

.attachment-remove {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.attachment-remove:hover {
  background: rgba(0, 0, 0, 0.08);
}

.attachment-remove svg {
  width: 12px;
  height: 12px;
}

.composer-body {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 4px 8px 4px 12px;
}

.composer-body textarea {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-dark);
  background: transparent;
  max-height: 160px;
  min-height: 24px;
  padding: 6px 0;
  font-family: inherit;
}

.composer-body textarea::placeholder { color: #b0b8c9; }

.composer-actions {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.action-btn svg { width: 18px; height: 18px; }

.send-action {
  background: #d1d5db;
  color: white;
}

.send-action.active {
  background: var(--primary-color);
  color: white;
}

.send-action.active:hover {
  background: #0a9e94;
  transform: scale(1.05);
}

.send-action:disabled {
  cursor: not-allowed;
}

.stop-action {
  background: #ef4444;
  color: white;
}

.stop-action:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 2px 12px 8px;
}

.footer-tip {
  font-size: 0.6875rem;
  color: #b0b8c9;
  white-space: nowrap;
  flex-shrink: 0;
}

.footer-hints {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  justify-content: flex-end;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  mask-image: linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%);
}

.hint-chip {
  padding: 2px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.hint-chip:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(11, 183, 170, 0.04);
}

/* 侧边栏 */
.tutor-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow-y: auto;
  margin-left: var(--spacing-md);
}

.sidebar-section {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  padding: var(--spacing-md);
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-sm);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  background: var(--background-color-base);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.tool-card:hover {
  background: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.tool-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
.tool-icon :deep(svg) { width: 100%; height: 100%; }
.tool-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-dark); }
.tool-desc { font-size: 0.5625rem; color: var(--text-muted); }

/* 知识库引用列表包裹层 */
.references-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* 知识库引用列表 */
.references-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.references-list::-webkit-scrollbar { width: 4px; }
.references-list::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
.references-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.references-list::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.reference-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  position: relative;
}

.reference-item:hover {
  background: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.reference-item.ref-kb { border-left: 3px solid #10b981; }
.reference-item.ref-file { border-left: 3px solid #3b82f6; }

.ref-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.ref-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ref-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref-meta {
  font-size: 0.6875rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ref-remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  opacity: 0;
}

.reference-item:hover .ref-remove-btn { opacity: 1; }

.ref-remove-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* 清空所有按钮 */
.clear-all-btn-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-xs);
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: var(--radius-lg);
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-all-btn-bottom svg { width: 14px; height: 14px; }

.clear-all-btn-bottom:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.clear-all-btn-bottom:active { transform: translateY(0); }

/* 空状态 */
.empty-references {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl) var(--spacing-md);
  text-align: center;
  gap: var(--spacing-sm);
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.empty-icon svg { width: 28px; height: 28px; }

.empty-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark);
  margin: 0;
}

.empty-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

/* RAG 选择器容器 */
.rag-selector-container { margin-bottom: var(--spacing-sm); }

.rag-selector-container :deep(.rag-reference-selector) {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.rag-selector-container :deep(.rag-reference-selector .el-button) {
  width: 100%;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.rag-selector-container :deep(.rag-reference-selector .el-button svg) { color: white; }

.rag-selector-container :deep(.rag-reference-selector .el-button):hover {
  background: #0a9e94;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.rag-selector-container :deep(.rag-reference-selector .el-button):active { transform: translateY(0); }

.rag-selector-container :deep(.rag-reference-selector .reference-tags) {
  display: none;
}

.history-list { display: flex; flex-direction: column; gap: 2px; }

.history-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;
}

.history-delete-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.history-item:hover .history-delete-btn {
  opacity: 1;
}

.history-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.history-item:hover { background: var(--background-color-base); }

.history-item.active {
  background: rgba(11, 183, 170, 0.08);
  border: 1px solid rgba(11, 183, 170, 0.15);
}

.history-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); flex-shrink: 0; }
.history-icon :deep(svg) { width: 100%; height: 100%; }

.history-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.history-title { font-size: 0.75rem; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-date { font-size: 0.5625rem; color: var(--text-muted); }

.history-count {
  font-size: 0.5625rem;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--background-color-base);
  color: var(--text-muted);
  flex-shrink: 0;
}

.history-loading, .history-empty {
  padding: var(--spacing-lg) var(--spacing-sm);
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-hint { font-size: 0.6875rem; margin-top: 4px; color: var(--text-muted); }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .tutor-container { grid-template-columns: 1fr; }
  .tutor-sidebar { display: none; }
  .history-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px !important;
    z-index: 200;
    border-radius: 0;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
    opacity: 1;
  }
  .history-sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
  }
  .history-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 199;
  }
  .welcome-features { grid-template-columns: repeat(2, 1fr); }
  .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-hints {
    justify-content: flex-start;
  }
}
</style>
