<template>
  <div class="friend-search animate-fade-in">
    <!-- Header -->
    <div class="search-header">
      <el-button text class="back-btn" @click="$emit('close')">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h3>添加新好友</h3>
    </div>

    <div class="search-content">
      <!-- Search Input controls -->
      <div class="search-input-area">
        <el-radio-group v-model="searchType" size="small" class="type-selector">
          <el-radio-button label="username">用户名</el-radio-button>
          <el-radio-button label="phone">手机号</el-radio-button>
        </el-radio-group>
        
        <el-input
          v-model="keyword"
          :placeholder="searchType === 'username' ? '输入用户名称 (支持模糊搜索)...' : '输入手机号码...'"
          clearable
          class="search-bar"
        >
          <template #append>
            <el-button :loading="searching" class="search-action-btn">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- Search results list -->
      <div class="search-results">
        <div v-if="searchResults.length > 0" class="result-list stagger-children">
          <div v-for="user in searchResults" :key="user.id" class="result-item hover-lift">
            <div class="user-avatar">
              <img :src="user.avatarUrl || '/default-avatar.png'" :alt="user.username" />
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-bio" :title="user.bio">{{ user.bio || '这个人很懒，什么都没留下~' }}</div>
            </div>
            <el-button
              type="primary"
              size="small"
              class="add-action-btn"
              @click="handleAddFriend(user)"
              :loading="addingUsers.has(user.id)"
            >
              添加
            </el-button>
          </div>
        </div>

        <div v-else-if="hasSearched && !searching" class="empty-result animate-fade-in">
          <el-empty description="未搜寻到相关用户" :image-size="50" />
        </div>

        <div v-else-if="!hasSearched" class="search-hint">
          <el-icon><Search /></el-icon>
          <p>输入任意关键词自动进行模糊检索</p>
        </div>
      </div>

      <!-- Friend Requests Section -->
      <div class="friend-requests-section">
        <div class="section-title">
          <span>收到的好友请求</span>
          <span class="request-badge" v-if="pendingRequests.length > 0">{{ pendingRequests.length }}</span>
        </div>

        <div v-if="pendingRequests.length > 0" class="request-list">
          <div v-for="request in pendingRequests" :key="request.id" class="request-item hover-lift animate-fade-in-up">
            <div class="request-avatar">
              <img :src="request.fromAvatarUrl || '/default-avatar.png'" :alt="request.fromUsername" />
            </div>
            <div class="request-info">
              <div class="request-name">{{ request.fromUsername }}</div>
              <div class="request-message">{{ request.message || '请求添加你为好友' }}</div>
              <div class="request-time">{{ formatTime(request.createdAt) }}</div>
            </div>
            <div class="request-actions">
              <el-button type="success" size="small" class="accept-btn" @click="handleAccept(request.id)">接受</el-button>
              <el-button size="small" class="reject-btn" @click="handleReject(request.id)">拒绝</el-button>
            </div>
          </div>
        </div>

        <div v-else class="empty-requests">
          <span class="text-muted">暂无待处理的好友请求</span>
        </div>
      </div>
    </div>

    <!-- Add Friend Verification Dialog -->
    <el-dialog v-model="showAddDialog" title="验证消息" width="380px" class="add-dialog">
      <div class="add-dialog-content">
        <p class="dialog-tip">向 <strong>{{ selectedUser?.username }}</strong> 发送好友申请</p>
        <el-input
          v-model="requestMessage"
          type="textarea"
          :rows="3"
          placeholder="给对方写一句话，介绍一下自己吧（可选）..."
          resize="none"
          class="dialog-textarea"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmAddFriend" :loading="sendingRequest" class="confirm-btn">发送申请</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMessageStore } from '@/stores/message'
import type { FriendInfo } from '@/api/message'

defineEmits<{
  (e: 'close'): void
}>()

const messageStore = useMessageStore()

const searchType = ref<'username' | 'phone'>('username')
const keyword = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<FriendInfo[]>([])
const addingUsers = ref(new Set<number>())

const showAddDialog = ref(false)
const selectedUser = ref<FriendInfo | null>(null)
const requestMessage = ref('')
const sendingRequest = ref(false)

const pendingRequests = computed(() => messageStore.pendingRequests)

onMounted(() => {
  messageStore.fetchFriendRequests()
})

// Watch for keyword and searchType changes to trigger fuzzy search immediately
watch(keyword, async (newVal) => {
  const val = newVal.trim()
  if (!val) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  searching.value = true
  hasSearched.value = true
  try {
    searchResults.value = await messageStore.searchUsers(val, searchType.value)
  } catch (error) {
    console.warn('即时搜索失败:', error)
  } finally {
    searching.value = false
  }
})

watch(searchType, async () => {
  const val = keyword.value.trim()
  if (!val) return

  searching.value = true
  try {
    searchResults.value = await messageStore.searchUsers(val, searchType.value)
  } catch (error) {
    console.warn('切换搜索类型失败:', error)
  } finally {
    searching.value = false
  }
})

function handleAddFriend(user: FriendInfo) {
  selectedUser.value = user
  requestMessage.value = ''
  showAddDialog.value = true
}

async function confirmAddFriend() {
  if (!selectedUser.value) return

  sendingRequest.value = true
  try {
    await messageStore.sendFriendRequest(selectedUser.value.id, requestMessage.value)
    ElMessage.success('好友请求已发送')
    showAddDialog.value = false
    addingUsers.value.add(selectedUser.value.id)
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sendingRequest.value = false
  }
}

async function handleAccept(requestId: number) {
  try {
    await messageStore.acceptRequest(requestId)
    ElMessage.success('已接受好友请求')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleReject(requestId: number) {
  try {
    await messageStore.rejectRequest(requestId)
    ElMessage.success('已拒绝好友请求')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.friend-search {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-soft);
  flex-shrink: 0;
}

.back-btn {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.back-btn:hover {
  color: var(--primary-color);
  background: var(--bg-secondary) !important;
}

.search-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-dark);
}

.search-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

.search-input-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex-shrink: 0;
}

.type-selector {
  align-self: flex-start;
}

:deep(.type-selector .el-radio-button__inner) {
  border-radius: var(--radius-md);
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
}

/* Customize element plus input append slot */
:deep(.search-bar .el-input__wrapper) {
  border-radius: var(--radius-lg) 0 0 var(--radius-lg) !important;
  background-color: var(--bg-secondary) !important;
  box-shadow: none !important;
  border: 1px solid transparent !important;
  border-right: none !important;
}

:deep(.search-bar .el-input-group__append) {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0 !important;
  background-color: var(--primary-color) !important;
  border: none !important;
  box-shadow: none !important;
  color: white !important;
  padding: 0 16px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

:deep(.search-bar .el-input-group__append:hover) {
  background-color: var(--primary-hover) !important;
}

.search-results {
  min-height: 100px;
  margin-bottom: var(--spacing-xl);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-soft);
  transition: all var(--transition-base);
}

.result-item:hover {
  background: var(--bg-card);
  border-color: var(--primary-lighter);
  box-shadow: var(--shadow-md);
}

.user-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--bg-card);
  box-shadow: var(--shadow-xs);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-dark);
}

.user-bio {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.add-action-btn {
  border-radius: var(--radius-lg) !important;
  padding: 6px 14px !important;
  font-size: 0.78rem;
  font-weight: 600;
}

.empty-result,
.search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--text-muted);
  text-align: center;
}

.search-hint .el-icon {
  font-size: 2.2rem;
  color: var(--primary-lighter);
  opacity: 0.6;
}

.search-hint p {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
}

.friend-requests-section {
  border-top: 1px solid var(--border-soft);
  padding-top: var(--spacing-lg);
  margin-top: auto; /* Push requests to bottom but keep inside scroll container */
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--spacing-md);
}

.request-badge {
  background: var(--danger-color);
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.request-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  background: var(--bg-secondary);
  border: 1px solid var(--border-soft);
  transition: all var(--transition-base);
}

.request-item:hover {
  background: var(--bg-card);
  border-color: var(--primary-lighter);
  box-shadow: var(--shadow-md);
}

.request-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--bg-card);
  box-shadow: var(--shadow-xs);
}

.request-info {
  flex: 1;
  min-width: 0;
}

.request-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-dark);
}

.request-message {
  font-size: 0.78rem;
  color: var(--text-regular);
  margin-top: 4px;
  word-break: break-all;
}

.request-time {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.request-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-self: center;
}

.accept-btn {
  font-weight: 600 !important;
  background: var(--gradient-accent) !important;
  border: none !important;
}

.reject-btn {
  font-weight: 600 !important;
}

.empty-requests {
  text-align: center;
  padding: var(--spacing-lg);
  font-size: 0.8rem;
}

.text-muted {
  color: var(--text-muted);
}

/* Dialog customizations */
.dialog-tip {
  font-size: 0.88rem;
  color: var(--text-regular);
  margin-bottom: var(--spacing-md);
}

:deep(.dialog-textarea .el-textarea__inner) {
  border-radius: var(--radius-lg) !important;
  background-color: var(--bg-secondary) !important;
  border: 1px solid var(--border-soft) !important;
  padding: 8px 12px !important;
  font-size: 0.85rem;
}

:deep(.dialog-textarea .el-textarea__inner:focus) {
  border-color: var(--primary-color) !important;
  background-color: var(--bg-card) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.confirm-btn {
  background: var(--gradient-primary) !important;
  border: none !important;
}
</style>
