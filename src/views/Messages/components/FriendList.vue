<template>
  <div class="friend-list animate-fade-in">
    <!-- Header -->
    <div class="friend-list-header">
      <div class="header-title">
        <el-button 
          link
          class="back-btn"
          @click="goBack"
          title="返回控制台"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span>消息中心</span>
      </div>

      <div class="header-actions">
        <!-- Notification Badge Button -->
        <el-badge :value="notifUnreadCount" :max="99" :hidden="notifUnreadCount === 0" class="notif-badge">
          <el-button circle class="header-action-btn" @click="showNotifDialog = true">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>

        <!-- Add Friend Button -->
        <el-tooltip content="添加好友" placement="bottom">
          <el-button 
            class="add-friend-btn"
            circle 
            @click="$emit('show-search')"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- Modern Tabs Slider -->
    <div class="list-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'chats' }"
        @click="activeTab = 'chats'"
      >
        <el-icon><ChatRound /></el-icon>
        <span>最近会话</span>
        <div v-if="unreadCount > 0" class="tab-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'friends' }"
        @click="activeTab = 'friends'"
      >
        <el-icon><User /></el-icon>
        <span>通讯录</span>
        <div v-if="pendingRequests.length > 0" class="tab-badge-dot"></div>
      </div>
    </div>

    <!-- Search input -->
    <div class="friend-list-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索..."
        :prefix-icon="Search"
        clearable
        size="default"
      />
    </div>

    <!-- Content List -->
    <div class="friend-list-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-skeleton" v-for="i in 4" :key="i">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-name"></div>
            <div class="skeleton-msg"></div>
          </div>
        </div>
      </div>

      <template v-else>
        <!-- Tab 1: Chats (Conversations) -->
        <div v-if="activeTab === 'chats'" class="tab-content-wrapper">
          <div v-if="filteredConversations.length > 0" class="conversations-group">
            <div
              v-for="conv in filteredConversations"
              :key="conv.friendId"
              class="friend-item"
              :class="{ active: currentChatFriendId === conv.friendId }"
              @click="handleSelectConversation(conv)"
            >
              <div class="friend-avatar">
                <img :src="conv.friendAvatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" :alt="conv.friendUsername" />
                <span v-if="isFriendOnline(conv.friendId)" class="online-dot pulsing"></span>
              </div>
              <div class="friend-info">
                <div class="friend-name-row">
                  <span class="friend-name">{{ conv.friendUsername }}</span>
                  <span v-if="conv.lastMessageTime" class="msg-time">{{ formatTime(conv.lastMessageTime) }}</span>
                </div>
                <div class="friend-last-msg">{{ conv.lastMessage || '暂无消息' }}</div>
              </div>
              <div class="friend-meta" v-if="conv.unreadCount > 0">
                <div class="unread-badge">
                  {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">
              <el-icon><ChatRound /></el-icon>
            </div>
            <p class="empty-title">暂无会话</p>
            <p class="empty-desc">在我的好友中选择好友开始聊天</p>
          </div>
        </div>

        <!-- Tab 2: Friends List -->
        <div v-if="activeTab === 'friends'" class="tab-content-wrapper">
          <!-- Online Friends -->
          <div v-if="filteredOnlineFriends.length > 0" class="friend-group">
            <div class="group-title">
              <span class="online-indicator"></span>
              在线好友 ({{ filteredOnlineFriends.length }})
            </div>
            <div
              v-for="friend in filteredOnlineFriends"
              :key="friend.id"
              class="friend-item"
              :class="{ active: currentChatFriendId === friend.id }"
              @click="handleSelectFriend(friend)"
            >
              <div class="friend-avatar">
                <img :src="friend.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" :alt="friend.username" />
                <span class="online-dot pulsing"></span>
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ friend.friendAlias || friend.username }}</div>
                <div class="friend-bio">{{ friend.bio || '这个人很懒，什么都没留下~' }}</div>
              </div>
            </div>
          </div>

          <!-- Offline Friends -->
          <div v-if="filteredOfflineFriends.length > 0" class="friend-group">
            <div class="group-title">离线好友 ({{ filteredOfflineFriends.length }})</div>
            <div
              v-for="friend in filteredOfflineFriends"
              :key="friend.id"
              class="friend-item"
              :class="{ active: currentChatFriendId === friend.id }"
              @click="handleSelectFriend(friend)"
            >
              <div class="friend-avatar">
                <img :src="friend.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" :alt="friend.username" />
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ friend.friendAlias || friend.username }}</div>
                <div class="friend-bio">{{ friend.bio || '这个人很懒，什么都没留下~' }}</div>
              </div>
            </div>
          </div>

          <div v-if="filteredOnlineFriends.length === 0 && filteredOfflineFriends.length === 0" class="empty-state">
            <div class="empty-icon">
              <el-icon><User /></el-icon>
            </div>
            <p class="empty-title">暂无好友</p>
            <p class="empty-desc">点击右上角 + 按钮添加好友</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Notification Dialog (通知中心小页面) -->
    <el-dialog
      v-model="showNotifDialog"
      title="通知中心"
      width="460px"
      destroy-on-close
      align-center
      class="notif-dialog"
    >
      <div class="notif-dialog-content">
        <div class="notif-list" v-if="notificationsList.length > 0">
          <div v-for="n in notificationsList" :key="n.id" class="notif-card" :class="{ unread: n.unread }">
            <div class="notif-card-header">
              <el-tag size="small" type="primary" class="notif-tag">
                好友申请
              </el-tag>
              <span class="notif-time">{{ n.time }}</span>
            </div>
            
            <div class="notif-card-body">
              <img :src="n.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" class="notif-avatar" />
              <div class="notif-detail">
                <span class="notif-username">{{ n.username }}</span>
                <span class="notif-text">{{ n.text }}</span>
              </div>
            </div>
            
            <div class="notif-actions">
              <el-button 
                type="primary" 
                size="small" 
                class="action-btn accept" 
                @click="handleNotifAction(n, 'accept')"
              >接受</el-button>
            </div>
          </div>
        </div>
        
        <div v-else class="notif-empty">
          <el-empty description="暂无新通知或待处理请求" :image-size="60" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showNotifDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, ChatRound, User, ArrowLeft, Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMessageStore } from '@/stores/message'
import type { FriendVO, Conversation } from '@/api/message'

const emit = defineEmits<{
  (e: 'show-search'): void
  (e: 'select-friend', friend: FriendVO): void
}>()

const router = useRouter()
const messageStore = useMessageStore()
const searchKeyword = ref('')
const activeTab = ref<'chats' | 'friends'>('chats')

const loading = computed(() => messageStore.loading)
const currentChatFriendId = computed(() => messageStore.currentChatFriendId)
const unreadCount = computed(() => messageStore.unreadCount)
const pendingRequests = computed(() => messageStore.pendingRequests)

// Modal dialog display state
const showNotifDialog = ref(false)

// 监听通知中心打开，获取最新好友请求
watch(showNotifDialog, async (newVal) => {
  if (newVal) {
    await messageStore.fetchFriendRequests()
  }
})

// Unified computed list of notifications
const notificationsList = computed(() => {
  const list: any[] = []

  // Add friend requests
  pendingRequests.value.forEach(req => {
    const sender = messageStore.friends.find(f => f.id === req.senderId)
    list.push({
      id: `friend-${req.id}`,
      type: 'friend_request',
      username: sender?.username || `用户${req.senderId}`,
      avatarUrl: sender?.avatarUrl || '',
      text: req.requestMsg || '请求添加你为好友',
      time: formatTime(req.createTime),
      originalId: req.id,
      unread: true
    })
  })

  return list
})

const notifUnreadCount = computed(() => notificationsList.value.length)

// Unified notification actions
async function handleNotifAction(n: any, action: 'accept') {
  if (n.type === 'friend_request') {
    try {
      await messageStore.acceptRequest(n.originalId)
      ElMessage.success(`已接受 ${n.username} 的好友申请`)
    } catch {
      ElMessage.error('处理好友申请失败')
    }
  }
}

function goBack() {
  router.push('/dashboard')
}

// Check if friend is online (基于status字段，1表示正常/在线)
function isFriendOnline(friendId: number): boolean {
  const friend = messageStore.friends.find(f => f.id === friendId)
  return friend?.status === 1
}

// Conversation Filtering
const filteredConversations = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return messageStore.conversations
  return messageStore.conversations.filter(c =>
    c.friendUsername.toLowerCase().includes(keyword) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(keyword))
  )
})

// Friends Filtering
const filteredOnlineFriends = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return messageStore.onlineFriends
  return messageStore.onlineFriends.filter(f =>
    f.username.toLowerCase().includes(keyword) ||
    (f.friendAlias && f.friendAlias.toLowerCase().includes(keyword))
  )
})

const filteredOfflineFriends = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  if (!keyword) return messageStore.offlineFriends
  return messageStore.offlineFriends.filter(f =>
    f.username.toLowerCase().includes(keyword) ||
    (f.friendAlias && f.friendAlias.toLowerCase().includes(keyword))
  )
})

// Selection Handlers
function handleSelectFriend(friend: FriendVO) {
  emit('select-friend', friend)
}

function handleSelectConversation(conv: Conversation) {
  const friend = messageStore.friends.find(f => f.id === conv.friendId)
  if (friend) {
    emit('select-friend', friend)
  } else {
    emit('select-friend', {
      id: conv.friendId,
      username: conv.friendUsername,
      avatarUrl: conv.friendAvatarUrl,
      status: 1
    })
  }
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.friend-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
}

.friend-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-xs);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-soft);
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-dark);
}

.back-btn {
  font-size: 1.25rem;
  color: var(--text-secondary);
  padding: 0 4px 0 0 !important;
  height: auto;
  transition: color var(--transition-fast);
}

.back-btn:hover {
  color: var(--primary-color);
  background: transparent !important;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.header-action-btn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-soft) !important;
  color: var(--text-secondary) !important;
  background: var(--bg-card) !important;
  transition: all var(--transition-fast);
}

.header-action-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--primary-color) !important;
  border-color: var(--primary-lighter) !important;
}

.add-friend-btn {
  width: 34px;
  height: 34px;
  background: var(--gradient-primary) !important;
  border: none !important;
  color: white !important;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.add-friend-btn:hover {
  transform: scale(1.06) rotate(90deg);
  box-shadow: var(--shadow-md);
}

.add-friend-btn .el-icon {
  font-size: 0.95rem;
}

/* Tabs switcher styling */
.list-tabs {
  display: flex;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-bottom: 1px solid var(--border-soft);
  gap: var(--spacing-xs);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-xs);
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.tab-item:hover {
  background: var(--bg-secondary);
  color: var(--text-dark);
}

.tab-item.active {
  background: rgba(59, 130, 246, 0.08);
  color: var(--primary-color);
}

.tab-item .el-icon {
  font-size: 1rem;
}

.tab-badge {
  background: var(--danger-color);
  color: white;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: var(--radius-full);
  min-width: 16px;
  text-align: center;
  font-weight: bold;
  margin-left: 2px;
}

.tab-badge-dot {
  width: 7px;
  height: 7px;
  background: var(--danger-color);
  border-radius: 50%;
  position: absolute;
  top: 6px;
  right: 14px;
}

.friend-list-search {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
}

/* Deep customize element plus input */
:deep(.el-input .el-input__wrapper) {
  background-color: var(--bg-secondary) !important;
  box-shadow: none !important;
  border: 1px solid transparent !important;
  border-radius: var(--radius-lg) !important;
  padding: 4px 12px;
}

:deep(.el-input .el-input__wrapper.is-focus) {
  border-color: var(--primary-lighter) !important;
  background-color: var(--bg-card) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
}

.friend-list-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs) 0;
}

.tab-content-wrapper {
  animation: fadeIn var(--transition-base);
}

/* Shimmer Loading */
.loading-container {
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.loading-skeleton {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-secondary);
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-name {
  width: 70px;
  height: 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-msg {
  width: 120px;
  height: 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.friend-group {
  margin-bottom: var(--spacing-md);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.online-indicator {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;
  position: relative;
}

.friend-item:hover {
  background: var(--bg-secondary);
}

.friend-item.active {
  background: rgba(59, 130, 246, 0.05);
  border-left-color: var(--primary-color);
}

.friend-avatar {
  position: relative;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bg-card);
  transition: transform var(--transition-fast);
}

.friend-item:hover .friend-avatar img {
  transform: scale(1.05);
}

.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 11px;
  height: 11px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}

.online-dot.pulsing {
  animation: glowPulse 2s infinite;
}

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.friend-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-last-msg {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.friend-bio {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.friend-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;
}

.msg-time {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--danger-color);
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(239, 68, 68, 0.35);
  margin-top: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.empty-icon .el-icon {
  font-size: 24px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs);
}

.empty-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

/* Notification Dialog Styles */
.notif-dialog-content {
  display: flex;
  flex-direction: column;
  max-height: 420px;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
  padding-right: 4px;
}

.notif-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-soft);
  transition: all var(--transition-fast);
}

.notif-card.unread {
  background: rgba(59, 130, 246, 0.04);
  border-color: var(--primary-lighter);
}

.notif-card:hover {
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.notif-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-tag {
  font-size: 0.65rem;
  padding: 0 6px;
  height: 18px;
  line-height: 16px;
  font-weight: 600;
}

.notif-time {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.notif-card-body {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.notif-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-light);
}

.notif-detail {
  flex: 1;
  min-width: 0;
}

.notif-user-info {
  display: flex;
  align-items: center;
}

.notif-username {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-dark);
}

.notif-text {
  font-size: 0.75rem;
  color: var(--text-regular);
  margin-top: 2px;
  word-break: break-all;
}

.notif-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
  margin-top: 4px;
}

.action-btn {
  padding: 3px 12px !important;
  font-size: 0.7rem !important;
  height: 22px !important;
  font-weight: 600 !important;
}

.action-btn.accept {
  background: var(--gradient-accent) !important;
  border: none !important;
}

.notif-empty {
  text-align: center;
  padding: var(--spacing-xl) 0;
  font-size: 0.8rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>
