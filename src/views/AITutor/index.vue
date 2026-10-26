<template>
  <AppLayout>
    <div class="ai-tutor-page">
      <div class="tutor-container" :class="{ 'assistant-collapsed': isAssistantCollapsed }">
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
            <!-- 只有在"还没有任何内容"时才显示加载态。
                 已有列表时，任何后台刷新都不应该有任何视觉提示（否则就是"点一下闪一下加载中"） -->
            <div
              class="history-loading"
              v-if="agentStore.conversationsLoading && agentStore.conversations.length === 0"
            >加载中...</div>
            <div
              class="history-empty"
              v-else-if="!agentStore.conversationsLoading && agentStore.conversations.length === 0"
            >
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
            <span class="current-conv-title">{{ currentConvTitle }}</span>
            <button
              v-if="isAssistantCollapsed"
              class="avatar-top-toggle"
              type="button"
              title="展开数字人"
              @click.stop="isAssistantCollapsed = false"
            >
              <span class="avatar-top-toggle-status" :class="{ active: !!avatarAuthInfo?.wssUrl }"></span>
              <el-icon><ArrowLeft /></el-icon>
              <span>数字人</span>
            </button>
          </div>
            <div class="chat-flow" ref="chatFlowRef">
              <div class="chat-flow-inner">
            <div class="chat-messages" v-loading="loadingHistory">
            <!-- 本地缓存提示：缓存先渲染，网络校验完成后消失 -->
            <div v-if="historyFromCache && messages.length > 0" class="cache-hint">
              已显示本地缓存
            </div>
            <!-- 更早历史：缓存优先，后端游标分页兜底 -->
            <div v-if="hasMoreHistory && messages.length > 0" class="load-older-history">
              <button class="load-older-button" :disabled="loadingOlder" @click="handleLoadOlder">
                {{ loadingOlder ? '加载中…' : '加载更早的消息' }}
              </button>
            </div>
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
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                  <path d="M483.002182 188.043636h51.2v114.036364H483.002182z" fill="#40e3c2"/>
                  <path d="M510.929455 143.825455m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#40e3c2"/>
                  <path d="M475.83125977 148.45865723v5.05620769h37.07885744v11.79781821h-16.8540259v23.59563642h16.8540259v11.79781817h-16.8540259V207.44774823l8.42701331 28.65184483h8.42701259v10.1124154h-15.16862307l-5.05620773-20.22483152L485.94367591 246.21200846H469.08964929v-11.7978182h11.79781818L485.94367591 207.44774823v-8.42701259H469.08964929v-11.79781893h18.5394287V163.62728031h-15.1686231L465.71884437 156.88566981v-8.42701258h10.1124154z m82.58472817 3.37080486v82.58472817l-10.1124154 11.79781822H519.65172773V151.82946209h38.76426021z m-11.79781819 11.79781822h-16.85402591v70.78690995h16.85402591V163.62728031z" fill="#40e3c2"/>
                  <path d="M679.098182 301.963636c139.636364 13.963636 223.418182 79.127273 253.672727 197.818182 46.545455 179.2 34.909091 267.636364 32.581818 283.927273-2.327273 18.618182-30.254545 123.345455-160.581818 174.545454-83.781818 32.581818-172.218182 55.854545-293.236364 53.527273v-535.272727 535.272727c-116.363636 2.327273-204.8-18.618182-286.254545-48.872727l-9.309091-4.654546c-130.327273-53.527273-158.254545-158.254545-160.581818-174.545454-4.654545-16.290909-13.963636-104.727273 30.254545-283.927273 30.254545-118.690909 114.036364-186.181818 251.345455-200.145454 37.236364-2.327273 93.090909-6.981818 172.218182-6.981819h9.309091c74.472727 0 128 4.654545 160.581818 9.309091z" fill="#C5C5C5"/>
                  <path d="M139.170909 723.2c0 2.327273 0 2.327273 0 0 0 4.654545 2.327273 6.981818 2.327273 9.309091 4.654545 9.309091 9.309091 16.290909 16.290909 25.6 18.618182 23.272727 46.545455 44.218182 83.781818 58.181818l4.654546 2.327273 4.654545 2.327273c53.527273 18.618182 107.054545 30.254545 165.236364 37.236363 58.181818 4.654545 123.345455 4.654545 183.854545 0 58.181818-4.654545 111.709091-18.618182 165.236364-37.236363l4.654545-2.327273c41.890909-13.963636 69.818182-34.909091 88.436364-60.509091 6.981818-9.309091 11.636364-18.618182 16.290909-25.6 0-2.327273 2.327273-4.654545 2.327273-6.981818v-2.327273c0-2.327273 0-6.981818 2.327272-11.636364v-2.327272-39.563637c-2.327273-44.218182-13.963636-97.745455-32.581818-162.909091-18.618182-74.472727-72.145455-111.709091-174.545454-121.018181-53.527273-4.654545-93.090909-6.981818-148.945455-6.981819H502.225455c-58.181818 0-97.745455 2.327273-155.927273 6.981819-102.4 9.309091-153.6 46.545455-174.545455 118.690909-18.618182 65.163636-27.927273 118.690909-32.581818 162.909091 0 16.290909-2.327273 30.254545 0 39.563636v16.290909z" fill="#14254E"/>
                  <path d="M509.207273 695.272727c-27.927273 0-55.854545 11.636364-55.854546 20.945455s11.636364 39.563636 55.854546 39.563636c41.890909 0 51.2-23.272727 55.854545-39.563636 0-13.963636-27.927273-20.945455-55.854545-20.945455z" fill="#40E3C2"/>
                  <path d="M295.936 578.373818a72.145455 53.527273 90 1 0 107.054545 0 72.145455 53.527273 90 1 0-107.054545 0Z" fill="#40E3C2"/>
                  <path d="M617.099636 578.373818a72.145455 53.527273 90 1 0 107.054546 0 72.145455 53.527273 90 1 0-107.054546 0Z" fill="#40E3C2"/>
                </svg>
              </div>
              <div class="welcome-content">
                <h3>{{ greetingText }}</h3>
                <p class="welcome-summary" v-html="welcomeSummary"></p>
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
              :key="msg.id"
              class="message-wrapper"
              :class="[msg.role, msg.status === 'streaming' ? 'is-streaming' : '']"
            >
              <div class="message-avatar">
                <svg v-if="msg.role === 'ai'" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
                  <path d="M483.002182 188.043636h51.2v114.036364H483.002182z" fill="#40e3c2"/>
                  <path d="M510.929455 143.825455m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#40e3c2"/>
                  <path d="M475.83125977 148.45865723v5.05620769h37.07885744v11.79781821h-16.8540259v23.59563642h16.8540259v11.79781817h-16.8540259V207.44774823l8.42701331 28.65184483h8.42701259v10.1124154h-15.16862307l-5.05620773-20.22483152L485.94367591 246.21200846H469.08964929v-11.7978182h11.79781818L485.94367591 207.44774823v-8.42701259H469.08964929v-11.79781893h18.5394287V163.62728031h-15.1686231L465.71884437 156.88566981v-8.42701258h10.1124154z m82.58472817 3.37080486v82.58472817l-10.1124154 11.79781822H519.65172773V151.82946209h38.76426021z m-11.79781819 11.79781822h-16.85402591v70.78690995h16.85402591V163.62728031z" fill="#40e3c2"/>
                  <path d="M679.098182 301.963636c139.636364 13.963636 223.418182 79.127273 253.672727 197.818182 46.545455 179.2 34.909091 267.636364 32.581818 283.927273-2.327273 18.618182-30.254545 123.345455-160.581818 174.545454-83.781818 32.581818-172.218182 55.854545-293.236364 53.527273v-535.272727 535.272727c-116.363636 2.327273-204.8-18.618182-286.254545-48.872727l-9.309091-4.654546c-130.327273-53.527273-158.254545-158.254545-160.581818-174.545454-4.654545-16.290909-13.963636-104.727273 30.254545-283.927273 30.254545-118.690909 114.036364-186.181818 251.345455-200.145454 37.236364-2.327273 93.090909-6.981818 172.218182-6.981819h9.309091c74.472727 0 128 4.654545 160.581818 9.309091z" fill="#C5C5C5"/>
                  <path d="M139.170909 723.2c0 2.327273 0 2.327273 0 0 0 4.654545 2.327273 6.981818 2.327273 9.309091 4.654545 9.309091 9.309091 16.290909 16.290909 25.6 18.618182 23.272727 46.545455 44.218182 83.781818 58.181818l4.654546 2.327273 4.654545 2.327273c53.527273 18.618182 107.054545 30.254545 165.236364 37.236363 58.181818 4.654545 123.345455 4.654545 183.854545 0 58.181818-4.654545 111.709091-18.618182 165.236364-37.236363l4.654545-2.327273c41.890909-13.963636 69.818182-34.909091 88.436364-60.509091 6.981818-9.309091 11.636364-18.618182 16.290909-25.6 0-2.327273 2.327273-4.654545 2.327273-6.981818v-2.327273c0-2.327273 0-6.981818 2.327272-11.636364v-2.327272-39.563637c-2.327273-44.218182-13.963636-97.745455-32.581818-162.909091-18.618182-74.472727-72.145455-111.709091-174.545454-121.018181-53.527273-4.654545-93.090909-6.981818-148.945455-6.981819H502.225455c-58.181818 0-97.745455 2.327273-155.927273 6.981819-102.4 9.309091-153.6 46.545455-174.545455 118.690909-18.618182 65.163636-27.927273 118.690909-32.581818 162.909091 0 16.290909-2.327273 30.254545 0 39.563636v16.290909z" fill="#14254E"/>
                  <path d="M509.207273 695.272727c-27.927273 0-55.854545 11.636364-55.854546 20.945455s11.636364 39.563636 55.854546 39.563636c41.890909 0 51.2-23.272727 55.854545-39.563636 0-13.963636-27.927273-20.945455-55.854545-20.945455z" fill="#40E3C2"/>
                  <path d="M295.936 578.373818a72.145455 53.527273 90 1 0 107.054545 0 72.145455 53.527273 90 1 0-107.054545 0Z" fill="#40E3C2"/>
                  <path d="M617.099636 578.373818a72.145455 53.527273 90 1 0 107.054546 0 72.145455 53.527273 90 1 0-107.054546 0Z" fill="#40E3C2"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="message-content">
                <div
                  class="message-bubble"
                  :class="{
                    'user-bubble': msg.role === 'user',
                    'message-bubble-error': msg.status === 'error',
                  }"
                >
                  <!-- 阶段指示器（规划中） -->
                  <div
                    v-if="msg.status === 'streaming' && agentStore.currentPhase === 'PLANNING' && !agentStore.currentTaskList"
                    class="phase-indicator"
                  >
                    <span class="phase-spinner"></span>
                    <span class="phase-label">正在分析目标并生成任务计划...</span>
                  </div>
                  <!-- 思考与工具调用过程（流式中自动展开，定稿后折叠） -->
                  <ReasoningProcess
                    v-if="msg.role === 'ai' && hasReasoningContent(msg)"
                    :segments="msg.reasoningSegments || []"
                    :thinking-text="msg.thinkingText || ''"
                    :tool-calls="msg.toolCalls || []"
                    :streaming="msg.status === 'streaming'"
                    :duration-ms="msg.thinkingDurationMs || null"
                  />
                  <!-- 网络搜索来源卡片 -->
                  <WebSearchSources
                    v-if="msg.role === 'ai' && msg.webSearchReferences?.length"
                    :references="msg.webSearchReferences"
                  />
                  <!-- RAG 检索来源卡片 -->
                  <RagSources
                    v-if="msg.role === 'ai' && msg.ragSources?.chunks?.length"
                    :sources="msg.ragSources"
                  />
                  <!-- AI 消息使用 Markdown 渲染（流式时内容逐字追加到同一条消息） -->
                  <MarkdownRenderer v-if="msg.role === 'ai' && msg.content" :content="msg.content" />
                  <!-- 学习空间卡片（业务结果展示） -->
                  <LearningSpaceCards
                    v-if="msg.role === 'ai' && msg.learningSpaceCards?.length"
                    :cards="msg.learningSpaceCards"
                  />
                  <!-- 思维导图卡片 -->
                  <template v-if="msg.role === 'ai' && msg.mindMaps?.length">
                    <MindMapCard
                      v-for="(mm, idx) in msg.mindMaps"
                      :key="'mm-' + idx"
                      :data="mm"
                    />
                  </template>
                  <template v-if="msg.role === 'user'">
                    <p class="message-text">{{ msg.content }}</p>
                    <div v-if="msg.attachmentFileIds?.length" class="message-attachment-hint">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                      <span>{{ msg.attachmentFileIds.length }}个附件</span>
                    </div>
                  </template>

                  <!-- 正在思考…（占位气泡，还没有任何可见内容时） -->
                  <div v-if="isThinkingPlaceholder(msg)" class="thinking-placeholder">
                    <span class="thinking-label">正在思考</span>
                    <span class="loading-dots"><span></span><span></span><span></span></span>
                  </div>

                  <!-- 断线重连提示：气泡与已生成内容保留，后台按 seq 游标补发遗漏事件 -->
                  <div v-if="msg.reconnecting" class="reconnect-hint">
                    <span class="reconnect-spinner"></span>
                    <span>连接中断，正在重连…</span>
                  </div>

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

                <!-- 操作按钮（生成中不显示） -->
                <div class="message-actions" v-if="msg.role === 'ai' && msg.status !== 'streaming'">
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

            <!-- 学习计划预览：流式期间与结束后都保留，直到用户确认创建学习空间 -->
            <div
              class="message-wrapper ai learning-plan-review-wrapper"
              v-if="agentStore.learningPlanDraft && agentStore.showLearningPlanPreview"
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
                <el-popover
                  v-model:visible="spaceSelectorVisible"
                  placement="top-start"
                  trigger="click"
                  popper-class="space-context-popover"
                  :width="340"
                  @show="ensureLearningSpacesLoaded"
                >
                  <template #reference>
                    <button
                      class="toolbar-btn context-toolbar-btn"
                      :class="{ active: hasFocusedContext }"
                      @click="handleContextClick"
                      :title="contextButtonTitle"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      <span>{{ contextButtonLabel }}</span>
                    </button>
                  </template>

                  <div class="space-context-panel">
                    <div class="space-context-header">
                      <span class="space-context-title">选择学习空间</span>
                      <button class="space-context-refresh" @click="refreshLearningSpaces" title="刷新学习空间">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <polyline points="1 20 1 14 7 14"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
                        </svg>
                      </button>
                    </div>

                    <div class="space-context-options">
                      <button
                        class="space-context-option"
                        :class="{ active: activeContext === 'global' }"
                        @click="selectGlobalContext"
                      >
                        <span class="space-option-icon global">全</span>
                        <span class="space-option-main">
                          <span class="space-option-name">全局学习</span>
                          <span class="space-option-meta">统筹所有学习空间</span>
                        </span>
                        <span v-if="activeContext === 'global'" class="space-option-check">✓</span>
                      </button>

                      <button
                        class="space-context-option"
                        :class="{ active: activeContext === 'evaluation' }"
                        @click="selectEvaluationContext"
                      >
                        <span class="space-option-icon evaluation">测</span>
                        <span class="space-option-main">
                          <span class="space-option-name">练习评测</span>
                          <span class="space-option-meta">错题、测评和薄弱点诊断</span>
                        </span>
                        <span v-if="activeContext === 'evaluation'" class="space-option-check">✓</span>
                      </button>

                      <div class="space-context-divider"></div>

                      <div v-if="learningSpaceStore.loading" class="space-context-loading">正在加载学习空间...</div>
                      <div v-else-if="availableLearningSpaces.length === 0" class="space-context-empty">
                        暂无可选择的学习空间
                      </div>
                      <template v-else>
                        <button
                          v-for="space in availableLearningSpaces"
                          :key="space.id"
                          class="space-context-option"
                          :class="{ active: selectedSpaceId === String(space.id) }"
                          @click="selectLearningSpace(String(space.id))"
                        >
                          <span
                            class="space-option-icon"
                            :style="{ background: space.bgColor, color: space.color }"
                          >
                            {{ space.icon }}
                          </span>
                          <span class="space-option-main">
                            <span class="space-option-name">{{ space.name }}</span>
                            <span class="space-option-meta">{{ formatSpaceType(space.type) }} · 进度 {{ space.progress }}%</span>
                          </span>
                          <span v-if="selectedSpaceId === String(space.id)" class="space-option-check">✓</span>
                        </button>
                      </template>
                    </div>
                  </div>
                </el-popover>
              </div>
              <div class="selected-space-strip" v-if="hasFocusedContext">
                <div class="selected-space-chip">
                  <span class="selected-space-dot" :style="selectedContextStyle"></span>
                  <span class="selected-space-label">{{ selectedContextChipText }}</span>
                  <button class="selected-space-clear" @click="selectGlobalContext" title="切回全局学习">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
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
                  :class="{ active: currentMode === 'AUTO' }"
                  @click="switchMode('AUTO')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path d="M12 2v4"/>
                    <path d="M12 18v4"/>
                    <path d="M4.93 4.93l2.83 2.83"/>
                    <path d="M16.24 16.24l2.83 2.83"/>
                    <path d="M2 12h4"/>
                    <path d="M18 12h4"/>
                    <path d="M4.93 19.07l2.83-2.83"/>
                    <path d="M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <span>智能路由</span>
                </button>
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
                  :placeholder="isListening ? '正在聆听…' : inputPlaceholder"
                  :disabled="isListening"
                  rows="1"
                  @keydown.enter.exact.prevent="sendMessage"
                  @keydown.enter.shift.exact.stop
                  @input="autoResize"
                  ref="inputRef"
                ></textarea>
                <div class="composer-actions">
                  <button
                    v-if="!voiceUnsupported"
                    class="action-btn mic-action"
                    :class="{ listening: isListening }"
                    :title="isListening ? '停止录音' : '语音输入'"
                    :aria-label="isListening ? '停止录音' : '语音输入'"
                    :disabled="agentStore.loading"
                    @click="toggleVoice"
                  >
                    <svg v-if="!isListening" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  </button>
                  <button
                    v-if="agentStore.loading"
                    class="action-btn stop-action"
                    @click="handleStopTask"
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

        <!-- 数字人面板：聊天区右侧的辅助陪伴面板，默认收起（v-if 确保收起时不建立 RTC 连接） -->
        <AssistantPanel
          v-if="!isAssistantCollapsed"
          class="assistant-panel-slot"
          :latestAiMessage="latestAiMessageForAvatar"
          :initial-auth-info="avatarAuthInfo"
          :auth-info-loading="avatarAuthLoading"
          @collapse="isAssistantCollapsed = true"
        />

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
                <span class="tool-icon" :class="{ 'tool-icon-lg': tool.id === 3 }" v-html="tool.icon"></span>
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
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useLearningSpaceStore } from '@/stores/learningSpace'
import {
  useAgentChat,
  readLastConversationId,
  type ChatMessage,
} from '@/composables/useAgentChat'
import { useAgentStore } from '@/stores/agent'
import type { ConversationVO } from '@/api/agent'
import { agentApi } from '@/api/agent'
import { agentAttachmentApi, type AttachmentStatus } from '@/api/agentAttachment'
import type { AgentTraceEvent, ReasoningSegment } from '@/stores/agent'
import { normalizeAgentTraceEvent } from '@/utils/agentTraceEvent'
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
import RagSources from '@/components/agent/RagSources.vue'
import MindMapCard from '@/components/agent/MindMapCard.vue'
import LearningSpaceCards from '@/components/agent/LearningSpaceCards.vue'
import { useWindowSize } from '@/composables/useWindowSize'
import { useAgentAttachmentUpload } from '@/composables/useAgentAttachmentUpload'
import { useVoiceInput } from '@/composables/useVoiceInput'
import RagReferenceSelector from '@/components/agent/RagReferenceSelector.vue'
import type { RagReference } from '@/composables/useAgentChat'
import AssistantPanel from '@/components/AssistantPanel.vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getAvatarAuthInfo, type AvatarAuthInfo } from '@/api/avatar'
import type { LearningSpaceType } from '@/api/learningSpace'

const userStore = useUserStore()
const agentStore = useAgentStore()
const learningSpaceStore = useLearningSpaceStore()
const route = useRoute()

const inputMessage = ref('')
const chatFlowRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const historySidebarOpen = ref(false)
const copiedIndex = ref<number | null>(null)
const attachments = ref<AttachmentStatus[]>([])
const pollingTimers = new Map<number, number>()
const { upload: uploadAttachment, uploadProgress, resetProgress } = useAgentAttachmentUpload()
const selectedReferences = ref<RagReference[]>([])
const spaceSelectorVisible = ref(false)
const selectedSpaceId = ref<string | null>(null)

// 数字人面板状态：默认收起，由用户主动点击右上角「数字人」按钮展开
const isAssistantCollapsed = ref(true)
const latestAiMessageForAvatar = ref('')
const avatarAuthInfo = ref<AvatarAuthInfo | null>(null)
const avatarAuthLoading = ref(true)

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
  historyFromCache,
  hasMoreHistory,
  loadingOlder,
  loadOlderMessages,
  currentForceMode,
  sendMessage: agentSend,
  stopTask,
  confirmPlan,
  cancelPlan,
  loadConversation,
  flushPendingOutbox,
  startNewConversation,
  deleteConversation,
  answerClarificationViaSSE,
  confirmGateViaSSE,
} = useAgentChat(scrollToBottom)

type ChatMode = 'AUTO' | 'REACT' | 'PLAN_AND_EXECUTE'

// 默认使用后端意图路由，让系统按用户问题选择工具集
const currentMode = ref<ChatMode>('AUTO')

const switchMode = (mode: ChatMode) => {
  currentMode.value = mode
  currentForceMode.value = mode === 'AUTO' ? null : mode
}

// 监听最后一条 AI 消息的内容变化（流式时逐字更新），同步给数字人。
// 不做 deep watch：现在流式文本直接写进消息对象，deep 会在每个 token 上遍历整个列表。
watch(
  () => {
    const last = messages.value[messages.value.length - 1]
    return last && last.role === 'ai' ? last.content : ''
  },
  (content) => {
    if (content) latestAiMessageForAvatar.value = content
  },
)

const preloadAvatarAuthInfo = async () => {
  avatarAuthLoading.value = true
  try {
    const response: any = await getAvatarAuthInfo()
    const result = response?.data || response || {}
    const authInfo = result?.wssUrl ? result : (result?.data || {})
    if (authInfo?.wssUrl) {
      avatarAuthInfo.value = {
        wssUrl: authInfo.wssUrl,
        appId: authInfo.appId || '',
        sceneId: authInfo.sceneId || '',
        uid: authInfo.uid || '',
        scene: authInfo.scene || '',
        interactMode: authInfo.interactMode || '',
        avatarId: authInfo.avatarId || '',
        voice: authInfo.voice || ''
      }
    }
  } catch (error) {
    console.warn('[AITutor] preload avatar auth info failed:', error)
  } finally {
    avatarAuthLoading.value = false
  }
}

type TutorContext = 'global' | 'evaluation' | 'space'

const activeContext = ref<TutorContext>('global')

const availableLearningSpaces = computed(() => {
  const activeSpaces = learningSpaceStore.activeSpaces
  return activeSpaces.length > 0 ? activeSpaces : learningSpaceStore.spaces
})

const selectedLearningSpace = computed(() => {
  if (!selectedSpaceId.value) return null
  return learningSpaceStore.spaces.find(space => String(space.id) === selectedSpaceId.value) || null
})

const hasFocusedContext = computed(() => activeContext.value !== 'global')

const contextButtonLabel = computed(() => {
  if (selectedLearningSpace.value) return selectedLearningSpace.value.name
  if (activeContext.value === 'space') return '已选择学习空间'
  if (activeContext.value === 'evaluation') return '练习评测'
  return '选择学习空间'
})

const contextButtonTitle = computed(() => {
  if (selectedLearningSpace.value) return `当前学习空间：${selectedLearningSpace.value.name}`
  if (activeContext.value === 'evaluation') return '当前上下文：练习评测'
  return '选择学习空间上下文'
})

const selectedContextChipText = computed(() => {
  if (selectedLearningSpace.value) return `当前学习空间：${selectedLearningSpace.value.name}`
  if (activeContext.value === 'evaluation') return '当前上下文：练习评测'
  return ''
})

const selectedContextStyle = computed(() => {
  if (selectedLearningSpace.value) {
    return { background: selectedLearningSpace.value.color }
  }
  if (activeContext.value === 'evaluation') {
    return { background: '#ec4899' }
  }
  return { background: '#6b7280' }
})

const formatSpaceType = (type: LearningSpaceType) => {
  const labelMap: Record<LearningSpaceType, string> = {
    course: '课程',
    exam: '考试',
    project: '项目',
    career: '职业',
    competition: '竞赛',
  }
  return labelMap[type] || '学习'
}

const ensureLearningSpacesLoaded = async () => {
  if (learningSpaceStore.loading || learningSpaceStore.spaces.length > 0) return
  await learningSpaceStore.fetchSpaces()
}

const refreshLearningSpaces = async () => {
  await learningSpaceStore.fetchSpaces()
  if (learningSpaceStore.error) {
    ElMessage.error(learningSpaceStore.error)
    return
  }
  ElMessage.success('学习空间列表已刷新')
}

const selectGlobalContext = () => {
  activeContext.value = 'global'
  selectedSpaceId.value = null
  spaceSelectorVisible.value = false
  ElMessage.success('已切换到全局学习上下文。总 Agent 将为你统筹所有学习空间。')
}

const selectEvaluationContext = () => {
  activeContext.value = 'evaluation'
  selectedSpaceId.value = null
  spaceSelectorVisible.value = false
  ElMessage.success('已切换到"练习评测"模式。测评 Agent 将协助你进行针对性小练与错题攻坚。')
}

const selectLearningSpace = (spaceId: string, notify = true) => {
  selectedSpaceId.value = spaceId
  activeContext.value = 'space'
  spaceSelectorVisible.value = false
  if (!notify) return

  const space = learningSpaceStore.spaces.find(item => String(item.id) === spaceId)
  ElMessage.success(
    space
      ? `已切换到"${space.name}"学习空间。空间 Agent 将专注于该领域的解答。`
      : '已切换到指定学习空间。'
  )
}

const switchContext = (ctxId: string) => {
  if (ctxId === 'global') {
    selectGlobalContext()
    return
  }
  if (ctxId === 'evaluation') {
    selectEvaluationContext()
    return
  }
  selectLearningSpace(ctxId)
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
  return learningSpaceStore.activeSpaces.length || learningSpaceStore.spaces.length
})
const todayAvailableHours = computed(() => {
  // TODO: 从每日计划 API 获取真实数据
  return '2小时30分钟'
})
const todayFocusText = computed(() => {
  if (selectedLearningSpace.value) {
    return `当前聚焦「${selectedLearningSpace.value.name}」，我会优先围绕这个学习空间回答。`
  }
  const focusNames = learningSpaceStore.activeSpaces.slice(0, 2).map(space => space.name)
  if (focusNames.length > 0) {
    return `${focusNames.join('和')}今天是重点，你也可以切换到某个学习空间继续深入。`
  }
  return '选择一个学习空间后，我会优先围绕该空间回答。'
})

const welcomeSummary = computed(() => {
  if (activeContext.value === 'evaluation') {
    return '我是你的测评智友。在这里，你可以让我为你进行针对性的随堂小练，或者帮你想办法吃透错题、诊断你的能力薄弱环节。准备好开始了吗？'
  }
  return `我正在管理你的 <strong>${learningSpaceCount.value} 个学习空间</strong>。今天你预计可用 <strong>${todayAvailableHours.value}</strong>。<br/>${todayFocusText.value}`
})

const welcomeFeatures = computed(() => {
  if (activeContext.value === 'evaluation') {
    return [
      {
        icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M320.618717 709.570751l311.023685-316.464605-159.049412-162.715919-320.259024 320.694953-3.094478 19.460214L312.765865 710.198038l7.852852-0.627287z m365.842198-372.018875l110.612237-112.471584 7.225565-44.74918L685.639201 62.11571l-47.529503 2.531659-116.408244 116.51569 164.759461 156.388817zM100.216981 789.613762l138.302903-59.706847-112.839975-92.719728-46.859237 112.450095-14.23419 51.919487 35.630499-11.943007z m9.216919 79.440283c-24.663726 0.084934-44.587498 20.031219-44.608987 44.694945 0.021489 24.659633 19.946284 44.649919 44.608987 44.75839h806.904567c24.661679 0 44.651966-19.990287 44.651965-44.649919v-0.108471c0-24.663726-19.990287-44.654013-44.61001-44.694945H109.4339z m806.450219-111.931278c24.856108 0 45.105291-20.206204 45.10529-45.128827s-20.249183-45.083801-45.10529-45.083801H468.374922c-24.90011 0-45.083801 20.24816-45.083801 45.299719 0 24.74866 20.183691 44.912909 45.083801 44.912909h447.509197z" fill="#59C666"></path></svg>',
        label: '生成微测验随堂练'
      },
      {
        icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M537.152 414.72h-288.64a29.44 29.44 0 0 1-26.24-30.72 29.44 29.44 0 0 1 26.24-32h288.64a29.44 29.44 0 0 1 26.24 32 29.44 29.44 0 0 1-26.24 30.72z m209.92 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z m0 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z" fill="#333333"></path><path d="M192.832 0a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h640a128 128 0 0 0 128-128l7.04-670.72L748.992 0h-556.16z m512 64l192 192h-160.64a31.36 31.36 0 0 1-31.36-31.36V64z m128 896h-640a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h448v192a64 64 0 0 0 64 64h192v576a64 64 0 0 1-64 64z" fill="#333333"></path></svg>',
        label: '诊断我的错题'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        label: '帮我分析薄弱知识点'
      },
      {
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        label: '查看已做测评历史'
      }
    ]
  }

  return [
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      label: '解释知识点'
    },
    {
      icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M320.618717 709.570751l311.023685-316.464605-159.049412-162.715919-320.259024 320.694953-3.094478 19.460214L312.765865 710.198038l7.852852-0.627287z m365.842198-372.018875l110.612237-112.471584 7.225565-44.74918L685.639201 62.11571l-47.529503 2.531659-116.408244 116.51569 164.759461 156.388817zM100.216981 789.613762l138.302903-59.706847-112.839975-92.719728-46.859237 112.450095-14.23419 51.919487 35.630499-11.943007z m9.216919 79.440283c-24.663726 0.084934-44.587498 20.031219-44.608987 44.694945 0.021489 24.659633 19.946284 44.649919 44.608987 44.75839h806.904567c24.661679 0 44.651966-19.990287 44.651965-44.649919v-0.108471c0-24.663726-19.990287-44.654013-44.61001-44.694945H109.4339z m806.450219-111.931278c24.856108 0 45.105291-20.206204 45.10529-45.128827s-20.249183-45.083801-45.10529-45.083801H468.374922c-24.90011 0-45.083801 20.24816-45.083801 45.299719 0 24.74866 20.183691 44.912909 45.083801 44.912909h447.509197z" fill="#59C666"></path></svg>',
      label: '生成练习题'
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g stroke="#701A75" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="25" y="42" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><path d="M41 50 H52 V32 H62 M52 50 V68 H62" stroke-width="5"/><rect x="62" y="24" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><rect x="62" y="60" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/></g></svg>',
      label: '生成思维导图'
    },
    {
      icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M537.152 414.72h-288.64a29.44 29.44 0 0 1-26.24-30.72 29.44 29.44 0 0 1 26.24-32h288.64a29.44 29.44 0 0 1 26.24 32 29.44 29.44 0 0 1-26.24 30.72z m209.92 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z m0 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z" fill="#B8860B"></path><path d="M192.832 0a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h640a128 128 0 0 0 128-128l7.04-670.72L748.992 0h-556.16z m512 64l192 192h-160.64a31.36 31.36 0 0 1-31.36-31.36V64z m128 896h-640a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h448v192a64 64 0 0 0 64 64h192v576a64 64 0 0 1-64 64z" fill="#B8860B"></path></svg>',
      label: '整理学习笔记'
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      label: '分析薄弱点'
    },
    {
      icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1024 512l-241.365333 241.365333-60.330667-60.330666L903.338667 512l-181.034667-181.034667 60.330667-60.330666L1024 512zM120.661333 512l181.034667 181.034667-60.330667 60.330666L0 512l241.365333-241.365333L301.653333 330.965333 120.661333 512z m296.96 384H326.826667l279.552-768h90.794666L417.621333 896z" fill="#5AADBB"></path></svg>',
      label: '代码示例'
    }
  ]
})

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
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    label: '知识讲解',
    desc: '深入讲解概念',
    prompt: '请详细讲解进程和线程的区别，包括它们的定义、特点、优缺点和使用场景'
  },
  {
    id: 2,
    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M320.618717 709.570751l311.023685-316.464605-159.049412-162.715919-320.259024 320.694953-3.094478 19.460214L312.765865 710.198038l7.852852-0.627287z m365.842198-372.018875l110.612237-112.471584 7.225565-44.74918L685.639201 62.11571l-47.529503 2.531659-116.408244 116.51569 164.759461 156.388817zM100.216981 789.613762l138.302903-59.706847-112.839975-92.719728-46.859237 112.450095-14.23419 51.919487 35.630499-11.943007z m9.216919 79.440283c-24.663726 0.084934-44.587498 20.031219-44.608987 44.694945 0.021489 24.659633 19.946284 44.649919 44.608987 44.75839h806.904567c24.661679 0 44.651966-19.990287 44.651965-44.649919v-0.108471c0-24.663726-19.990287-44.654013-44.61001-44.694945H109.4339z m806.450219-111.931278c24.856108 0 45.105291-20.206204 45.10529-45.128827s-20.249183-45.083801-45.10529-45.083801H468.374922c-24.90011 0-45.083801 20.24816-45.083801 45.299719 0 24.74866 20.183691 44.912909 45.083801 44.912909h447.509197z" fill="#59C666"></path></svg>',
    label: '生成练习',
    desc: '针对薄弱点',
    prompt: '请根据我的学习记录，生成10道关于进程同步与互斥的专项练习题'
  },
  {
    id: 3,
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><g stroke="#701A75" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="25" y="42" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><path d="M41 50 H52 V32 H62 M52 50 V68 H62" stroke-width="5"/><rect x="62" y="24" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/><rect x="62" y="60" width="16" height="16" rx="3" fill="#E8D5E8" stroke-width="5"/></g></svg>',
    label: '思维导图',
    desc: '知识可视化',
    prompt: '请为我生成一份"操作系统进程管理"的知识思维导图'
  },
  {
    id: 4,
    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M537.152 414.72h-288.64a29.44 29.44 0 0 1-26.24-30.72 29.44 29.44 0 0 1 26.24-32h288.64a29.44 29.44 0 0 1 26.24 32 29.44 29.44 0 0 1-26.24 30.72z m209.92 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z m0 165.76h-498.56a32.64 32.64 0 0 1 0-64h498.56a32.64 32.64 0 0 1 0 64z" fill="#B8860B"></path><path d="M192.832 0a128 128 0 0 0-128 128v768a128 128 0 0 0 128 128h640a128 128 0 0 0 128-128l7.04-670.72L748.992 0h-556.16z m512 64l192 192h-160.64a31.36 31.36 0 0 1-31.36-31.36V64z m128 896h-640a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h448v192a64 64 0 0 0 64 64h192v576a64 64 0 0 1-64 64z" fill="#B8860B"></path></svg>',
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
    icon: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1024 512l-241.365333 241.365333-60.330667-60.330666L903.338667 512l-181.034667-181.034667 60.330667-60.330666L1024 512zM120.661333 512l181.034667 181.034667-60.330667 60.330666L0 512l241.365333-241.365333L301.653333 330.965333 120.661333 512z m296.96 384H326.826667l279.552-768h90.794666L417.621333 896z" fill="#5AADBB"></path></svg>',
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

const { isListening, voiceUnsupported, toggleVoice, stopVoice } = useVoiceInput(inputMessage, {
  onUpdate: autoResize,
  onEnd: () => nextTick(() => inputRef.value?.focus()),
})

const sendMessage = async () => {
  if (!inputMessage.value.trim() || agentStore.loading) return
  if (isListening.value) stopVoice()
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

const handleNewChat = () => {
  // 只做本地重置：清空当前会话与附件，立刻给出新对话界面
  startNewConversation()
  clearAttachmentState()
  // 后台静默增量同步：有新会话才插进来，没变化就完全不动，
  // 不置 loading，侧边栏不会闪"加载中..."（旧实现是整表刷新）
  agentStore.syncConversations()
}

const handleStopTask = () => {
  stopTask()
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
    // 本地已移除该项，这里只做静默增量同步兜底，不整表刷新
    agentStore.syncConversations()
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
  void ensureLearningSpacesLoaded()
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

/** 加载更早消息并保持当前视口位置（否则顶部插入会让内容突然下跳） */
const handleLoadOlder = async () => {
  const el = chatFlowRef.value
  const previousHeight = el?.scrollHeight || 0
  const previousTop = el?.scrollTop || 0
  await loadOlderMessages()
  await nextTick()
  if (el) {
    el.scrollTop = el.scrollHeight - previousHeight + previousTop
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

/**
 * 是否是"空的占位气泡"：正在生成，但还没有任何可见内容。
 * 此时显示「正在思考…」，避免出现一个空白的 AI 气泡。
 */
function isThinkingPlaceholder(msg: ChatMessage): boolean {
  if (msg.status !== 'streaming') return false
  // 学习计划草稿有自己的展示卡片，此时不需要"正在思考"
  if (agentStore.learningPlanDraft && agentStore.showLearningPlanPreview) return false
  return !msg.content
    && !hasReasoningContent(msg)
    && !msg.webSearchReferences?.length
    && !msg.ragSources?.chunks?.length
    && !msg.learningSpaceCards?.length
    && !msg.mindMaps?.length
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
      // 批量接口取单条 trace：与历史消息共用同一套用户过滤与精简 DTO
      const traceMap = await agentApi.getTraceEventsBatch([msg.traceId])
      const normalized = (traceMap[msg.traceId] || []).map(normalizeAgentTraceEvent)
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

const handleGateConfirm = (_taskId: string) => {
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
 * 追踪时间线里没有 agent.think.delta（后端不持久化，前端也不再收集 token 级 delta），
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
  // 没有过程事件就没有时间线可挂（实时流里 delta 不落 traceEvents），直接交给空状态
  if (events.length === 0) return events

  // 优先使用 reasoningSegments 精确重建思考与工具的交错顺序
  if (reasoningSegments?.length) {
    return interleaveThinkFromSegments(events, reasoningSegments)
  }

  if (!thinkingText) return events
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
 * 使追踪面板的思考→工具→思考交错结构与消息里的推理过程一致。
 */
function interleaveThinkFromSegments(
  events: AgentTraceEvent[],
  segments: ReasoningSegment[],
): AgentTraceEvent[] {
  const ref = events[0]
  if (!ref) return events
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
      // 思考/正文由 reasoningSegments 重建；忽略数组里可能残留的 token 级 delta，
      // 避免二次打开追踪面板时把已合成的事件再当成后置事件追加一遍。
      case 'agent.think.delta':
      case 'agent.text.delta':
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
  // 数字人面板默认收起（含宽屏），不再按窗口宽度自动展开
  preloadAvatarAuthInfo()
  // 先用 IndexedDB 缓存渲染侧边栏，再后台拉服务端列表（SWR）
  void agentStore.hydrateCachedConversations()
  void agentStore.fetchConversations()
  document.addEventListener('visibilitychange', handleVisibilitySync)
  ensureLearningSpacesLoaded().then(() => {
    const routeSpaceId = route.query.spaceId
    if (typeof routeSpaceId === 'string' && routeSpaceId) {
      selectLearningSpace(routeSpaceId, false)
    }
  })
  if (window.innerWidth < 768) {
    historySidebarOpen.value = false
  }

  // 检测路由 query 参数，实现错题回顾快捷对话唤起
  const action = route.query.action
  const jobId = route.query.jobId
  const title = route.query.title
  if (action === 'review_wrong' && jobId) {
    // 1. 切换上下文到练习评测
    switchContext('evaluation')
    // 2. 自动发起错题讲解对话
    nextTick(() => {
      ElMessage.info(`正在为您加载 "${title || '本次'}" 测评的错题回顾...`)
      setTimeout(() => {
        sendQuickMessage(`分析我的测评错题，试卷ID为 ${jobId}`)
      }, 500)
    })
  } else {
    // 刷新后恢复上次会话：否则页面停在欢迎页，看起来像“消息全没了”。
    // loadConversation 内部会继续接回仍在执行的生成（从 Redis 事件日志回放）。
    const lastConversationId = readLastConversationId()
    if (lastConversationId) {
      loadConversation(lastConversationId)
        .then(() => loadConversationAttachments(lastConversationId))
        .catch(() => { /* 会话可能已被删除，loadConversation 内部已处理 */ })
        .finally(() => { void flushPendingOutbox() })
    } else {
      void flushPendingOutbox()
    }
  }
})

onUnmounted(() => {
  clearAttachmentState()
  document.removeEventListener('visibilitychange', handleVisibilitySync)
  if (autoConfirmTimer) {
    clearInterval(autoConfirmTimer)
    autoConfirmTimer = null
  }
})

/**
 * 兜底对齐：窗口重新可见时静默同步一次会话列表。
 * 覆盖"事件驱动拿不到"的场景（SSE 断线、在别的标签页/设备新建了会话）。
 * 60s 节流，切换标签页不会每次都打接口。
 */
function handleVisibilitySync() {
  if (document.visibilityState !== 'visible') return
  agentStore.syncConversations({ minIntervalMs: 60_000 })
  void flushPendingOutbox()
}

watch(windowWidth, (newWidth, oldWidth) => {
  if (newWidth < 1280 && oldWidth >= 1280) {
    isAssistantCollapsed.value = true
  }
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
  margin: calc(var(--spacing-xl) * -1) auto calc(var(--spacing-xl) * -1);
  padding: var(--spacing-xs) 0 0;
}

.tutor-container {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) clamp(292px, 19vw, 320px) 280px;
  grid-template-areas: "history chat assistant sidebar";
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.tutor-container.assistant-collapsed {
  grid-template-columns: auto minmax(0, 1fr) 280px;
  grid-template-areas: "history chat sidebar";
}

.assistant-panel-slot {
  grid-area: assistant;
  width: calc(100% - 12px);
  margin-left: 12px;
  align-self: stretch;
}

.tutor-container.assistant-collapsed .assistant-panel-slot {
  display: none !important;
}

/* 历史会话侧边栏 */
.history-sidebar {
  grid-area: history;
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
  grid-area: chat;
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
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

/* 收起历史侧边栏后，扩大聊天内容区域以填充多出的空间 */
.chat-area:not(.sidebar-open) .chat-flow-inner {
  max-width: min(1150px, 100%);
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
  flex: 1;
  min-width: 0;
}

.avatar-top-toggle {
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.22);
  background: rgba(99, 102, 241, 0.08);
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
}

.avatar-top-toggle:hover {
  background: rgba(99, 102, 241, 0.14);
  border-color: rgba(99, 102, 241, 0.38);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.12);
  transform: translateY(-1px);
}

.avatar-top-toggle .el-icon {
  font-size: 14px;
}

.avatar-top-toggle-status {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #cbd5e1;
  flex-shrink: 0;
}

.avatar-top-toggle-status.active {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.75);
}

.chat-messages {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.cache-hint {
  align-self: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-color-secondary, #64748b);
  background: rgba(148, 163, 184, 0.12);
}

.load-older-history {
  display: flex;
  justify-content: center;
}

.load-older-button {
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: transparent;
  color: var(--text-color-secondary, #64748b);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.load-older-button:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.14);
  color: var(--text-color, #0f172a);
}

.load-older-button:disabled {
  cursor: default;
  opacity: 0.6;
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

.chat-area:not(.sidebar-open) .planning-execution-shelf {
  max-width: min(1150px, 100%);
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

.chat-area:not(.sidebar-open) .message-wrapper.ai .message-content {
  max-width: 1050px;
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

/* 流式光标：跟在最后一段文字尾部（而不是单独占一行） */
.message-wrapper.is-streaming :deep(.markdown-renderer) > *:last-child::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 15px;
  margin-left: 2px;
  background: var(--primary-color);
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

/* 正在思考… 占位气泡 */
.thinking-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 2px 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.thinking-label {
  letter-spacing: 0.02em;
}

.thinking-placeholder .loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* 断线重连提示：与“正在思考”同排，弱提示色，不打断阅读 */
.reconnect-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-top: 4px;
  padding: 2px 0;
  font-size: 0.8125rem;
  color: #b26a00;
}

.reconnect-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(178, 106, 0, 0.25);
  border-top-color: #b26a00;
  border-radius: 50%;
  animation: reconnect-spin 0.8s linear infinite;
}

@keyframes reconnect-spin {
  to { transform: rotate(360deg); }
}

/* 生成失败/中断：气泡给一点轻微提示色 */
.message-bubble-error {
  background: rgba(239, 68, 68, 0.04);
  border-radius: var(--radius-lg);
  padding: 4px 8px;
}

/* 流式中的消息不再有淡入动画，避免每个 delta 都闪一下 */
.message-wrapper.is-streaming {
  animation: none;
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

.context-toolbar-btn {
  max-width: 180px;
}

.context-toolbar-btn span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.context-toolbar-btn.active {
  background: rgba(11, 183, 170, 0.1);
  color: var(--primary-color);
}

:deep(.space-context-popover) {
  padding: 0;
  border-radius: 8px;
}

.space-context-panel {
  padding: 10px;
}

.space-context-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 2px 8px;
}

.space-context-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.space-context-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.space-context-refresh svg {
  width: 14px;
  height: 14px;
}

.space-context-refresh:hover {
  background: #f1f5f9;
  color: var(--primary-color);
}

.space-context-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 360px;
  overflow-y: auto;
}

.space-context-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.space-context-option:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.space-context-option.active {
  background: rgba(11, 183, 170, 0.08);
  border-color: rgba(11, 183, 170, 0.25);
}

.space-option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
}

.space-option-icon.global {
  background: #f1f5f9;
  color: #64748b;
}

.space-option-icon.evaluation {
  background: #fce7f3;
  color: #db2777;
}

.space-option-main {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.space-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  font-weight: 650;
}

.space-option-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.space-option-check {
  flex: 0 0 auto;
  color: var(--primary-color);
  font-weight: 800;
}

.space-context-divider {
  height: 1px;
  margin: 4px 0;
  background: #eef2f7;
}

.space-context-loading,
.space-context-empty {
  padding: 16px 8px;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
}

.selected-space-strip {
  display: flex;
  padding: 6px 10px 0;
}

.selected-space-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 28px;
  padding: 4px 6px 4px 10px;
  border: 1px solid rgba(11, 183, 170, 0.2);
  border-radius: 8px;
  background: rgba(11, 183, 170, 0.08);
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.selected-space-dot {
  flex: 0 0 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.selected-space-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-space-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.selected-space-clear svg {
  width: 12px;
  height: 12px;
}

.selected-space-clear:hover {
  background: rgba(11, 183, 170, 0.12);
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

.mic-action {
  background: transparent;
  color: #64748b;
  margin-right: 6px;
}

.mic-action:hover:not(:disabled) {
  color: var(--primary-color);
  background: rgba(11, 183, 170, 0.1);
}

.mic-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mic-action.listening {
  color: white;
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  animation: micPulse 1.2s ease-in-out infinite;
}

@keyframes micPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
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
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow-y: auto;
  padding-left: var(--spacing-md);
  box-sizing: border-box;
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
.tool-icon-lg { width: 26px; height: 26px; }
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

@media (max-width: 1280px) {
  .tutor-container {
    grid-template-columns: auto minmax(0, 1fr) 280px;
    grid-template-areas: "history chat sidebar";
  }

  .tutor-container.assistant-collapsed {
    grid-template-columns: auto minmax(0, 1fr) 280px;
    grid-template-areas: "history chat sidebar";
  }

  .assistant-panel-slot {
    position: absolute;
    top: 0;
    right: 280px;
    bottom: 0;
    z-index: 35;
    width: min(320px, calc(100% - 300px));
    min-width: 292px;
    height: 100%;
    margin-left: 0;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
  }
}

@media (max-width: 768px) {
  .tutor-container,
  .tutor-container.assistant-collapsed {
    grid-template-columns: 1fr;
    grid-template-areas: "chat";
  }
  .tutor-sidebar { display: none; }
  .assistant-panel-slot {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    top: auto;
    z-index: 210;
    width: auto;
    min-width: 0;
    height: min(70vh, 620px);
    margin-left: 0;
  }
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

@media (max-width: 768px) {
  .avatar-top-toggle {
    position: fixed;
    right: 16px;
    bottom: 88px;
    z-index: 210;
    height: 44px;
    padding: 8px 12px;
    border-radius: 16px;
    background: var(--color-card-bg);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.18);
    backdrop-filter: blur(16px);
  }

  .avatar-top-toggle:hover {
    transform: translateY(-2px);
  }
}

/* ==================== 深色主题覆盖（AITutor 页面）==================== */
:global(html[data-theme='dark']) {
  /* 聊天主区域 */
  .chat-area {
    background: var(--panel-bg) !important;
    border-color: var(--border-color) !important;
  }

  /* 历史会话侧边栏 */
  .history-sidebar {
    background: var(--panel-bg) !important;
    border-color: var(--border-color) !important;
  }

  .history-sidebar-header {
    border-bottom-color: var(--border-color) !important;
  }

  .history-sidebar-title {
    color: var(--text-primary) !important;
  }

  /* 聊天顶部导航栏 */
  .chat-area-top-bar {
    background: var(--panel-bg) !important;
    border-bottom-color: var(--border-color) !important;
  }

  /* 输入区域 */
  .chat-input-area,
  .input-wrapper,
  .input-footer {
    background: var(--panel-bg) !important;
    border-top-color: var(--border-color) !important;
  }

  .chat-textarea {
    background: var(--input-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
  }

  /* 消息气泡 */
  .message-bubble {
    &.assistant {
      background: var(--panel-bg-secondary) !important;
      border-color: var(--border-color) !important;
      color: var(--text-primary) !important;
    }
  }

  /* 资源卡片 */
  .resource-card-mini {
    background: var(--panel-bg-secondary) !important;
    border-color: var(--border-color) !important;
  }

  .res-title {
    color: var(--text-primary) !important;
  }

  /* 右侧边栏 */
  .right-sidebar,
  .context-sidebar {
    background: var(--panel-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  /* 消息操作按钮 */
  .msg-action-btn {
    border-color: var(--border-color) !important;
    color: var(--text-muted) !important;
    &:hover {
      background: var(--item-hover-bg) !important;
      color: var(--text-secondary) !important;
    }
  }

  /* 新增：输入框容器深色 */
  .input-composer {
    background: var(--input-bg) !important;
    border-color: var(--border-color) !important;
    
    &:focus-within {
      border-color: var(--primary-color) !important;
    }
  }

  /* 新增：快捷按钮与提问标签 */
  .feature-item {
    background: var(--button-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;

    &:hover {
      background: var(--button-hover-bg) !important;
      border-color: var(--border-strong) !important;
      color: var(--text-primary) !important;
    }
  }

  .hint-chip {
    background: var(--button-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;

    &:hover {
      background: var(--button-hover-bg) !important;
      border-color: var(--border-strong) !important;
      color: var(--text-primary) !important;
    }
  }

  /* 新增：右侧面板与内部工具 */
  .sidebar-section {
    background: var(--panel-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  .tool-card {
    background: var(--panel-bg-secondary) !important;
    border-color: var(--border-color) !important;

    &:hover {
      background: var(--button-hover-bg) !important;
      border-color: var(--border-strong) !important;
    }
    
    .tool-label {
      color: var(--text-primary) !important;
    }
    .tool-desc {
      color: var(--text-muted) !important;
    }
  }

  /* 新增：知识库引用项和清空按钮 */
  .reference-item {
    background: var(--panel-bg-secondary) !important;
    border-color: var(--border-color) !important;
    
    &:hover {
      background: var(--button-hover-bg) !important;
      border-color: var(--border-strong) !important;
    }
    
    .ref-name {
      color: var(--text-primary) !important;
    }
    .ref-meta {
      color: var(--text-muted) !important;
    }
  }

  .clear-all-btn-bottom {
    background: var(--button-bg) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;

    &:hover {
      border-color: var(--danger-color) !important;
      color: var(--danger-color) !important;
      background: rgba(239, 68, 68, 0.1) !important;
    }
  }

  /* 新增：附件条 */
  .attachment-chip {
    background: var(--panel-bg-secondary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;
  }

  /* 新增：空状态样式 */
  .empty-text {
    color: var(--text-primary) !important;
  }
  .empty-hint {
    color: var(--text-muted) !important;
  }

  /* 新增：历史列表 hover 态 */
  .history-item:hover {
    background: var(--item-hover-bg) !important;
  }
  .history-title {
    color: var(--text-primary) !important;
  }

  /* 新增：placeholder 与 textarea 文字适配 */
  .composer-body textarea {
    color: var(--text-primary) !important;
    
    &::placeholder {
      color: var(--text-muted) !important;
    }
  }
}
</style>
