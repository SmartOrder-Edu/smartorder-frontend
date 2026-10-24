<template>
  <div class="chat-window">
    <template v-if="friend">
      <!-- Chat Header -->
      <div class="chat-header glass">
        <div class="friend-info">
          <div class="avatar-wrapper">
            <img :src="friend.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" :alt="friend.username" class="friend-avatar" />
            <span class="status-dot" :class="{ online: isOnline }"></span>
          </div>
          <div class="friend-details">
            <div class="friend-name">{{ friend.friendAlias || friend.username }}</div>
            <div class="friend-status-text">
              {{ isOnline ? '在线' : '离线' }}
            </div>
          </div>
        </div>
        <div class="chat-actions">
          <el-dropdown trigger="click" @command="handleHeaderCommand">
            <el-button text circle class="action-btn">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="delete" class="danger-item">
                  <el-icon><Delete /></el-icon>删除好友
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Messages History Area -->
      <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
        <div v-if="loadingMessages" class="loading-messages">
          <div class="loading-spinner"></div>
          <span>正在获取历史消息...</span>
        </div>

        <div v-else-if="messages.length === 0" class="empty-messages">
          <div class="empty-animation">
            <div class="chat-bubble-icon animate-float">
              <el-icon><ChatRound /></el-icon>
            </div>
          </div>
          <p class="empty-title">与 {{ friend.username }} 的新会话</p>
          <p class="empty-desc">发送一条消息，开启有趣的对话吧~</p>
        </div>

        <template v-else>
          <div
            v-for="(msg, index) in messages"
            :key="msg.id"
            class="message-wrapper animate-fade-in-up"
            :class="{ 'is-mine': msg.senderId === currentUserId }"
          >
            <!-- Time Divider -->
            <div v-if="showTimeDivider(index)" class="time-divider">
              <span>{{ formatMessageTime(msg.createTime) }}</span>
            </div>

            <!-- Speech Bubble -->
            <div class="message-bubble" @contextmenu.prevent="showContextMenu($event, msg)">
              <img
                v-if="msg.senderId !== currentUserId"
                :src="friend.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'"
                class="message-avatar"
              />
              <div class="message-content-wrapper">
                <div class="message-content" :class="{ 'recalled': msg.status === 2 }">
                  <!-- 已撤回消息 -->
                  <div v-if="msg.status === 2" class="message-recalled">
                    <el-icon><Warning /></el-icon>
                    <span>消息已撤回</span>
                  </div>
                  
                  <!-- Text type -->
                  <div v-else-if="msg.msgType === 'TEXT'" class="message-text">{{ msg.content }}</div>
                  
                  <!-- Image type -->
                  <div v-else-if="msg.msgType === 'IMAGE'" class="message-image-container">
                    <el-image
                      :src="msg.content"
                      :preview-src-list="[msg.content]"
                      class="message-image"
                      fit="cover"
                      loading="lazy"
                      preview-teleported
                    />
                  </div>

                  <!-- Voice type -->
                  <div v-else-if="msg.msgType === 'VOICE'" class="message-voice">
                    <el-icon><Microphone /></el-icon>
                    <span>语音消息</span>
                  </div>

                  <!-- File type -->
                  <div v-else-if="msg.msgType === 'FILE'" class="message-file-card">
                    <div class="file-icon-wrapper">
                      <el-icon><Document /></el-icon>
                    </div>
                    <div class="file-details">
                      <div class="file-name" :title="parseFileContent(msg.content).name">
                        {{ parseFileContent(msg.content).name }}
                      </div>
                      <div class="file-size">{{ parseFileContent(msg.content).size }}</div>
                    </div>
                    <div class="file-actions" v-if="parseFileContent(msg.content).url">
                      <el-button 
                        type="primary" 
                        link 
                        @click="downloadFileDirectly(parseFileContent(msg.content).url, parseFileContent(msg.content).name)"
                      >
                        <el-icon><Download /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>

                <!-- Message delivery/read status -->
                <div class="message-status" v-if="msg.senderId === currentUserId && msg.status !== 2">
                  <span class="status-time">{{ formatTimeOnly(msg.createTime) }}</span>
                  <el-icon v-if="msg.status === 0" class="status-icon"><Check /></el-icon>
                  <el-icon v-else-if="msg.status === 1" class="status-icon read"><Select /></el-icon>
                </div>
                <div class="message-status" v-else-if="msg.status !== 2">
                  <span class="status-time">{{ formatTimeOnly(msg.createTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Context Menu -->
      <div v-if="contextMenu.visible" class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
        <div class="context-menu-item" @click="handleRecallMessage" v-if="contextMenu.msg?.senderId === currentUserId && canRecall(contextMenu.msg)">
          <el-icon><RefreshLeft /></el-icon>
          <span>撤回</span>
        </div>
        <div class="context-menu-item" @click="contextMenu.visible = false">
          <el-icon><Close /></el-icon>
          <span>取消</span>
        </div>
      </div>

      <!-- Real-time upload progress display -->
      <div v-if="uploadingFile" class="uploading-progress-panel animate-fade-in">
        <div class="progress-details">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span class="uploading-text">正在发送文件: {{ uploadingFileName }} ({{ uploadProgress }}%)</span>
        </div>
        <el-progress :percentage="uploadProgress" :show-text="false" stroke-width="4" status="success" />
      </div>

      <!-- Input Bar Area -->
      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <div class="input-toolbar">
            <!-- Emoji Popover -->
            <el-popover
              placement="top-start"
              :width="320"
              trigger="click"
              popper-style="padding: 12px; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl);"
            >
              <template #reference>
                <el-button text circle size="default" class="toolbar-btn">
                  <el-icon><ChatDotRound /></el-icon>
                </el-button>
              </template>
              <div class="emoji-picker">
                <div class="emoji-title">常用表情</div>
                <div class="emoji-list">
                  <span
                    v-for="emoji in emojis"
                    :key="emoji"
                    class="emoji-item"
                    @click="addEmoji(emoji)"
                  >{{ emoji }}</span>
                </div>
              </div>
            </el-popover>

            <!-- Image Upload Button -->
            <el-tooltip content="发送图片" placement="top">
              <el-button text circle size="default" class="toolbar-btn" @click="triggerImageUpload">
                <el-icon><Picture /></el-icon>
              </el-button>
            </el-tooltip>

            <!-- File Upload Button -->
            <el-tooltip content="发送文件" placement="top">
              <el-button text circle size="default" class="toolbar-btn" @click="triggerFileUpload">
                <el-icon><Paperclip /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
          
          <div class="input-area">
            <el-input
              v-model="messageText"
              type="textarea"
              :rows="2"
              placeholder="说点什么吧... (Enter 发送, Shift+Enter 换行)"
              resize="none"
              class="message-textarea"
              @keydown.enter.exact.prevent="handleSend"
            />
            <el-button
              class="send-btn"
              type="primary"
              @click="handleSend"
              :loading="sending"
              :disabled="sending || !messageText.trim()"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- Invisible File Inputs -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleImageUpload"
      />
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        @change="handleFileUpload"
      />
    </template>

    <!-- Welcome Empty Chat Center -->
    <template v-else>
      <div class="empty-chat">
        <div class="empty-chat-animation">
          <div class="chat-icon-wrapper animate-breathe">
            <el-icon><ChatRound /></el-icon>
          </div>
          <div class="float-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h3 class="empty-chat-title">知序消息中心</h3>
        <p class="empty-chat-desc">在左侧选择好友或添加好友开始安全加密聊天</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { 
  MoreFilled, Loading, Check, Select, 
  Picture, Paperclip, Document, ChatRound, 
  Promotion, Download, Delete, ChatDotRound,
  Warning, Microphone, RefreshLeft, Close
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { messageApi, type FriendVO, type ChatMessage } from '@/api/message'

const props = defineProps<{
  friend: FriendVO | null
}>()

const emit = defineEmits<{
  (e: 'delete-friend', friendId: number): void
}>()

const messageStore = useMessageStore()
const userStore = useUserStore()

const messagesContainer = ref<HTMLElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const messageText = ref('')
const sending = ref(false)
const loadingMessages = ref(false)

// File upload state variables
const uploadingFile = ref(false)
const uploadingFileName = ref('')
const uploadProgress = ref(0)

// Context menu state
const contextMenu = ref({ visible: false, x: 0, y: 0, msg: null as ChatMessage | null })

const currentUserId = computed(() => userStore.userInfo?.id)
const messages = computed(() => messageStore.currentMessages)

const isOnline = computed(() => props.friend?.status === 1)

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '👋', '👍', '👎', '👊', '👏', '🙌', '🤝', '🙏', '❤️', '✨'
]

watch(() => props.friend, async (newFriend) => {
  if (newFriend) {
    loadingMessages.value = true
    await messageStore.fetchChatMessages(newFriend.id)
    loadingMessages.value = false
    await nextTick()
    scrollToBottom()
  }
}, { immediate: true })

watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', hideContextMenu)
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleScroll() {
  if (!messagesContainer.value || !props.friend) return
  if (messagesContainer.value.scrollTop === 0) {
    const friendId = props.friend.id
    const currentMessages = messageStore.chatMessages.get(friendId) || []
    if (currentMessages.length >= 20) {
      messageStore.fetchChatMessages(friendId, Math.ceil(currentMessages.length / 20) + 1)
    }
  }
}

async function handleSend() {
  // 在请求开始时拦截重复点击和连续回车，避免同一条私信被发送多次。
  if (sending.value || !messageText.value.trim() || !props.friend) return

  sending.value = true
  try {
    await messageStore.sendMessage(props.friend.id, messageText.value.trim(), 'TEXT')
    messageText.value = ''
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

function addEmoji(emoji: string) {
  messageText.value += emoji
}

function triggerImageUpload() {
  imageInput.value?.click()
}

function triggerFileUpload() {
  fileInput.value?.click()
}

// Upload image and send
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.friend) return

  uploadingFile.value = true
  uploadingFileName.value = file.name
  uploadProgress.value = 30

  try {
    // 1. 先上传文件获取URL
    uploadProgress.value = 60
    const imageUrl = await messageApi.uploadChatFile(file, 'IMAGE')
    uploadProgress.value = 90

    // 2. 通过WebSocket发送图片消息
    await messageStore.sendMessage(props.friend.id, imageUrl, 'IMAGE')
    uploadProgress.value = 100
    ElMessage.success('图片发送成功')
  } catch (error) {
    ElMessage.error('图片发送失败')
  } finally {
    setTimeout(() => {
      uploadingFile.value = false
      uploadProgress.value = 0
      uploadingFileName.value = ''
    }, 350)
    input.value = ''
  }
}

// Upload file and send
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.friend) return

  uploadingFile.value = true
  uploadingFileName.value = file.name
  uploadProgress.value = 20

  try {
    // 1. 先上传文件获取URL
    uploadProgress.value = 50
    const fileUrl = await messageApi.uploadChatFile(file, 'FILE')
    uploadProgress.value = 80

    // 2. 通过WebSocket发送文件消息（content格式：fileName|fileSize|fileUrl）
    const content = `${file.name}|${file.size}|${fileUrl}`
    await messageStore.sendMessage(props.friend.id, content, 'FILE')
    uploadProgress.value = 100
    ElMessage.success('文件发送成功')
  } catch (error) {
    ElMessage.error('文件发送失败')
  } finally {
    setTimeout(() => {
      uploadingFile.value = false
      uploadProgress.value = 0
      uploadingFileName.value = ''
    }, 350)
    input.value = ''
  }
}

function handleHeaderCommand(command: string) {
  if (command === 'delete') {
    handleDeleteFriend()
  }
}

async function handleDeleteFriend() {
  if (!props.friend) return
  try {
    await ElMessageBox.confirm(`确定删除好友 ${props.friend.username}？删除后将清空聊天历史记录。`, '删除好友警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      buttonSize: 'default',
      confirmButtonClass: 'el-button--danger'
    })
    emit('delete-friend', props.friend.id)
  } catch {
    // cancelled
  }
}

// Context menu functions
function showContextMenu(event: MouseEvent, msg: ChatMessage) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    msg
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

// 判断消息是否可以撤回（2分钟内）
function canRecall(msg: ChatMessage | null): boolean {
  if (!msg) return false
  const now = new Date().getTime()
  const msgTime = new Date(msg.createTime).getTime()
  return now - msgTime < 2 * 60 * 1000 // 2分钟
}

async function handleRecallMessage() {
  const msg = contextMenu.value.msg
  if (!msg || !props.friend) return
  
  try {
    await ElMessageBox.confirm('确定要撤回这条消息吗？', '撤回消息')
    await messageStore.recallMessage(msg.id, props.friend.id)
    ElMessage.success('消息已撤回')
  } catch {
    // cancelled
  }
  contextMenu.value.visible = false
}

// File message parser
function parseFileContent(content: string) {
  if (content && content.includes('|')) {
    const parts = content.split('|')
    return {
      name: parts[0],
      size: formatFileSize(Number(parts[1]) || 0),
      url: parts[2]
    }
  }
  return {
    name: content || '未定义文件',
    size: '未知大小',
    url: ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function downloadFileDirectly(url: string, name: string) {
  if (!url) return
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return
  }
  window.open(url, '_blank')
}

function showTimeDivider(index: number): boolean {
  if (index === 0) return true
  const prev = messages.value[index - 1]
  const curr = messages.value[index]
  if (!prev || !curr) return false

  const prevTime = new Date(prev.createTime).getTime()
  const currTime = new Date(curr.createTime).getTime()
  return currTime - prevTime > 300000 // 5 minutes
}

function formatMessageTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatTimeOnly(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-soft);
  box-shadow: var(--shadow-xs);
  z-index: 10;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
}

.friend-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bg-secondary);
  box-shadow: var(--shadow-xs);
}

.status-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #94a3b8;
  border: 2px solid var(--bg-card);
}

.status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
  animation: breatheDot 2s ease-in-out infinite;
}

@keyframes breatheDot {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.1); opacity: 1; }
}

.friend-details {
  display: flex;
  flex-direction: column;
}

.friend-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
}

.friend-status-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.action-btn {
  width: 32px;
  height: 32px;
  color: var(--text-secondary) !important;
}

.action-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--text-dark) !important;
}

.danger-item {
  color: var(--danger-color) !important;
}

.danger-item:hover {
  background: rgba(239, 68, 68, 0.05) !important;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.loading-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-3xl);
  color: var(--text-muted);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--bg-secondary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-3xl);
  text-align: center;
}

.empty-animation {
  margin-bottom: var(--spacing-lg);
}

.chat-bubble-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-bubble-icon .el-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.empty-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message-wrapper.is-mine {
  align-self: flex-end;
}

.time-divider {
  text-align: center;
  margin: var(--spacing-sm) 0;
}

.time-divider span {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.message-bubble {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.is-mine .message-bubble {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
}

.is-mine .message-content-wrapper {
  align-items: flex-end;
}

.message-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--border-soft);
}

.is-mine .message-content {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.message-content.recalled {
  background: var(--bg-secondary) !important;
  border-color: var(--border-soft) !important;
  opacity: 0.7;
}

.message-recalled {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.message-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-dark);
  word-break: break-word;
}

.is-mine .message-text {
  color: white;
}

.message-image-container {
  max-width: 240px;
}

.message-image {
  max-width: 100%;
  border-radius: var(--radius-md);
}

.message-voice {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-regular);
}

.is-mine .message-voice {
  color: white;
}

.message-file-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 180px;
}

.file-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.is-mine .file-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
}

.file-icon-wrapper .el-icon {
  font-size: 18px;
  color: var(--primary-color);
}

.is-mine .file-icon-wrapper .el-icon {
  color: white;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-mine .file-name {
  color: white;
}

.file-size {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.is-mine .file-size {
  color: rgba(255, 255, 255, 0.7);
}

.file-actions .el-button {
  padding: 4px !important;
}

.is-mine .file-actions .el-button {
  color: white !important;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 0 4px;
}

.status-time {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.status-icon {
  font-size: 12px;
  color: var(--text-muted);
}

.status-icon.read {
  color: var(--primary-color);
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-soft);
  padding: 4px;
  z-index: 1000;
  min-width: 100px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--text-regular);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--bg-secondary);
  color: var(--text-dark);
}

.uploading-progress-panel {
  position: absolute;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-sm) var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-soft);
  z-index: 20;
  min-width: 280px;
}

.progress-details {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.uploading-text {
  font-size: 0.8rem;
  color: var(--text-regular);
}

.chat-input-container {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
  border-top: 1px solid var(--border-soft);
}

.chat-input-wrapper {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.chat-input-wrapper:focus-within {
  border-color: var(--primary-lighter);
  background: var(--bg-card);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.toolbar-btn {
  width: 32px !important;
  height: 32px !important;
  color: var(--text-secondary) !important;
}

.toolbar-btn:hover {
  background: var(--bg-card) !important;
  color: var(--primary-color) !important;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm) var(--spacing-sm);
}

:deep(.message-textarea .el-textarea__inner) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 8px 12px !important;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: none;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50% !important;
  background: var(--gradient-primary) !important;
  border: none !important;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.send-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.send-btn:disabled {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

/* Empty Chat Center */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--bg-primary);
  padding: var(--spacing-3xl);
}

.empty-chat-animation {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.chat-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--primary-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
}

.chat-icon-wrapper .el-icon {
  font-size: 36px;
  color: white;
}

.float-dots {
  display: flex;
  gap: 6px;
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
}

.float-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-lighter);
  animation: floatDot 1.5s ease-in-out infinite;
}

.float-dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.float-dots span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes floatDot {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-8px); opacity: 1; }
}

.empty-chat-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.empty-chat-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

/* Emoji Picker */
.emoji-picker {
  max-height: 200px;
  overflow-y: auto;
}

.emoji-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.emoji-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emoji-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.emoji-item:hover {
  background: var(--bg-secondary);
  transform: scale(1.1);
}

/* Animation classes */
.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25); }
  50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(59, 130, 246, 0.35); }
}
</style>
