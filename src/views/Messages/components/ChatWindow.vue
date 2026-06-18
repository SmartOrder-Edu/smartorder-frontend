<template>
  <div class="chat-window">
    <template v-if="friend">
      <!-- Chat Header -->
      <div class="chat-header glass">
        <div class="friend-info">
          <div class="avatar-wrapper">
            <img :src="friend.avatarUrl || '/default-avatar.png'" :alt="friend.username" class="friend-avatar" />
            <span class="status-dot" :class="{ online: friend.online }"></span>
          </div>
          <div class="friend-details">
            <div class="friend-name">{{ friend.username }}</div>
            <div class="friend-status-text">
              {{ friend.online ? '在线' : '离线' }}
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
              <span>{{ formatMessageTime(msg.createdAt) }}</span>
            </div>

            <!-- Speech Bubble -->
            <div class="message-bubble">
              <img
                v-if="msg.senderId !== currentUserId"
                :src="friend.avatarUrl || '/default-avatar.png'"
                class="message-avatar"
              />
              <div class="message-content-wrapper">
                <div class="message-content">
                  <!-- Text type -->
                  <div v-if="msg.type === 'text'" class="message-text">{{ msg.content }}</div>
                  
                  <!-- Image type -->
                  <div v-else-if="msg.type === 'image'" class="message-image-container">
                    <el-image
                      :src="msg.content"
                      :preview-src-list="[msg.content]"
                      class="message-image"
                      fit="cover"
                      loading="lazy"
                      preview-teleported
                    />
                  </div>

                  <!-- File type -->
                  <div v-else-if="msg.type === 'file'" class="message-file-card">
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
                <div class="message-status" v-if="msg.senderId === currentUserId">
                  <span class="status-time">{{ formatTimeOnly(msg.createdAt) }}</span>
                  <el-icon v-if="msg.status === 'sent'" class="status-icon"><Check /></el-icon>
                  <el-icon v-else-if="msg.status === 'delivered'" class="status-icon"><Check /></el-icon>
                  <el-icon v-else-if="msg.status === 'read'" class="status-icon read"><Select /></el-icon>
                </div>
                <div class="message-status" v-else>
                  <span class="status-time">{{ formatTimeOnly(msg.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
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
              :disabled="!messageText.trim()"
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
import { ref, computed, watch, nextTick } from 'vue'
import { 
  MoreFilled, Loading, Check, Select, 
  Picture, Paperclip, Document, ChatRound, 
  Promotion, Download, Delete, ChatDotRound 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { uploadKnowledgeBaseCover } from '@/api/knowledgeBase'
import type { FriendInfo, ChatMessage } from '@/api/message'

const props = defineProps<{
  friend: FriendInfo | null
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

const currentUserId = computed(() => userStore.userInfo?.id)
const messages = computed(() => messageStore.currentMessages)

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
  if (!messageText.value.trim() || !props.friend) return

  sending.value = true
  try {
    await messageStore.sendMessage(props.friend.id, messageText.value.trim(), 'text')
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
  uploadProgress.value = 15

  try {
    uploadProgress.value = 35
    let imageUrl = ''
    try {
      imageUrl = await uploadKnowledgeBaseCover(file)
      uploadProgress.value = 80
    } catch (apiError) {
      console.warn('后端图片上传接口调用失败，使用本地Blob URL作为展示:', apiError)
      imageUrl = URL.createObjectURL(file)
      uploadProgress.value = 90
    }

    await messageStore.sendMessage(props.friend.id, imageUrl, 'image')
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
  uploadProgress.value = 10

  try {
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 85) {
        uploadProgress.value += 12
      }
    }, 150)

    let fileUrl = ''
    try {
      // Try calling cover upload API first
      fileUrl = await uploadKnowledgeBaseCover(file)
    } catch {
      fileUrl = URL.createObjectURL(file)
    }

    clearInterval(progressInterval)
    uploadProgress.value = 95

    const content = `${file.name}|${file.size}|${fileUrl}`
    await messageStore.sendMessage(props.friend.id, content, 'file')
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

  const prevTime = new Date(prev.createdAt).getTime()
  const currTime = new Date(curr.createdAt).getTime()
  return currTime - prevTime > 300000 // 5 minutes
}

function formatMessageTime(time: string): string {
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
  margin-top: 1px;
}

.action-btn {
  font-size: 1.15rem;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--text-dark);
}

.danger-item {
  color: var(--danger-color) !important;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.02), transparent 400px), 
              radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.01), transparent 400px);
}

.loading-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--bg-secondary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
}

.empty-animation {
  margin-bottom: var(--spacing-lg);
}

.chat-bubble-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-bubble-icon .el-icon {
  font-size: 32px;
  color: var(--primary-color);
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.empty-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}

.time-divider {
  text-align: center;
  margin: var(--spacing-md) 0;
}

.time-divider span {
  font-size: 0.68rem;
  color: var(--text-muted);
  background: rgba(148, 163, 184, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
}

.message-wrapper.is-mine {
  align-items: flex-end;
}

.message-bubble {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  max-width: 75%;
}

.message-wrapper.is-mine .message-bubble {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1.5px solid var(--bg-secondary);
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.message-wrapper.is-mine .message-content-wrapper {
  align-items: flex-end;
}

.message-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
  width: fit-content;
}

.message-wrapper.is-mine .message-content {
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-lg) var(--radius-lg) 4px var(--radius-lg);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
  border: none;
}

.message-text {
  font-size: 0.88rem;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

/* Image styles */
.message-image-container {
  max-width: 260px;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.message-image {
  max-width: 100%;
  max-height: 220px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.message-image:hover {
  transform: scale(1.02);
}

/* File Card styles */
.message-file-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-soft);
  min-width: 200px;
  max-width: 320px;
}

.message-wrapper.is-mine .message-file-card {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.file-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.message-wrapper.is-mine .file-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
}

.file-size {
  font-size: 0.72rem;
  opacity: 0.8;
  margin-top: 2px;
}

.file-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-actions .el-button {
  color: var(--primary-color);
  font-size: 1.15rem;
}

.message-wrapper.is-mine .file-actions .el-button {
  color: white;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.status-time {
  opacity: 0.7;
}

.status-icon {
  font-size: 0.75rem;
}

.status-icon.read {
  color: var(--primary-color);
}

/* Upload Panel styling */
.uploading-progress-panel {
  background: var(--bg-card);
  border-top: 1px solid var(--border-soft);
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.progress-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-regular);
}

.uploading-text {
  font-weight: 600;
}

/* Chat Input styling */
.chat-input-container {
  background: var(--bg-card);
  border-top: 1px solid var(--border-soft);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  z-index: 10;
}

.chat-input-wrapper {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-soft);
  padding: 6px var(--spacing-md) var(--spacing-md);
  box-shadow: var(--shadow-inner);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.chat-input-wrapper:focus-within {
  border-color: var(--primary-lighter);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.input-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.toolbar-btn {
  font-size: 1.15rem;
  color: var(--text-secondary);
  width: 34px;
  height: 34px;
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--primary-color);
}

.input-area {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

/* Customize element plus textarea */
:deep(.message-textarea .el-textarea__inner) {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 4px 0 !important;
  font-size: 0.88rem;
  color: var(--text-primary);
  font-family: inherit;
  line-height: 1.5;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50% !important;
  padding: 0 !important;
  background: var(--gradient-primary) !important;
  border: none !important;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: var(--shadow-lg);
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.send-btn .el-icon {
  font-size: 1.05rem;
}

/* Emoji Picker styling */
.emoji-picker {
  display: flex;
  flex-direction: column;
}

.emoji-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.emoji-list {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform var(--transition-fast), background-color var(--transition-fast);
  padding: 4px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  transform: scale(1.22);
  background: var(--bg-secondary);
}

/* Welcome page styling */
.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.empty-chat-animation {
  position: relative;
  margin-bottom: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-icon-wrapper {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.chat-icon-wrapper .el-icon {
  font-size: 42px;
  color: var(--primary-color);
}

.float-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 16px;
}

.float-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-lighter);
  animation: bounce 1.4s ease-in-out infinite;
}

.float-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.float-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.empty-chat-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
  letter-spacing: 0.03em;
}

.empty-chat-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
}
</style>
