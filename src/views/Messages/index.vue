<template>
  <AppLayout>
    <div class="messages-page animate-fade-in-scale">
      <div class="messages-container glass">
        <div class="messages-sidebar" :class="{ 'show-sidebar': showSidebar }">
          <FriendList
            v-if="!showSearch"
            @show-search="showSearch = true"
            @select-friend="handleSelectFriend"
          />
          <FriendSearch
            v-else
            @close="showSearch = false"
          />
        </div>

        <div class="messages-main" :class="{ 'show-main': !showSidebar || currentFriend }">
          <div v-if="currentFriend" class="mobile-back-btn" @click="handleBackToList">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回列表</span>
          </div>
          <ChatWindow
            :friend="currentFriend"
            @delete-friend="handleDeleteFriend"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import FriendList from './components/FriendList.vue'
import FriendSearch from './components/FriendSearch.vue'
import ChatWindow from './components/ChatWindow.vue'
import type { FriendVO } from '@/api/message'

const messageStore = useMessageStore()
const userStore = useUserStore()

const showSearch = ref(false)
const showSidebar = ref(true)
const currentFriend = ref<FriendVO | null>(null)

onMounted(async () => {
  try {
    await Promise.all([
      messageStore.fetchFriends(),
      messageStore.fetchConversations(),
      messageStore.fetchUnreadCount()
    ])
  } catch (err) {
    console.warn('初始化消息页面 API 失败:', err)
  }

  window.addEventListener('ws-message', handleWsMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('ws-message', handleWsMessage)
  messageStore.setCurrentChat(null)
})

function handleWsMessage(event: Event) {
  const customEvent = event as CustomEvent
  const { type, data } = customEvent.detail || {}

  if (type === 'CHAT_MESSAGE') {
    messageStore.receiveMessage(data)
  } else if (type === 'FRIEND_REQUEST') {
    ElMessage.info('收到新的好友请求')
    messageStore.fetchFriendRequests()
  }
}

function handleSelectFriend(friend: FriendVO) {
  currentFriend.value = friend
  messageStore.setCurrentChat(friend.id)
  showSearch.value = false

  if (window.innerWidth <= 768) {
    showSidebar.value = false
  }
}

function handleBackToList() {
  showSidebar.value = true
  currentFriend.value = null
  messageStore.setCurrentChat(null)
}

async function handleDeleteFriend(friendId: number) {
  try {
    await messageStore.deleteFriend(friendId)
    if (currentFriend.value?.id === friendId) {
      currentFriend.value = null
      messageStore.setCurrentChat(null)
    }
    ElMessage.success('好友已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.messages-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.messages-container {
  display: flex;
  height: 100%;
  background: var(--bg-card);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(20px);
}

.messages-sidebar {
  width: 360px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-soft);
  background: var(--bg-card);
  z-index: 2;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.messages-main {
  flex: 1;
  min-width: 0;
  position: relative;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.mobile-back-btn {
  display: none;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  color: var(--primary-color);
  font-size: 0.9rem;
  font-weight: 600;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.mobile-back-btn:hover {
  background: var(--bg-secondary);
  color: var(--primary-hover);
}

.mobile-back-btn .el-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .messages-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    transform: translateX(0);
  }

  .messages-sidebar:not(.show-sidebar) {
    transform: translateX(-100%);
  }

  .messages-main {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    transform: translateX(100%);
  }

  .messages-main.show-main {
    transform: translateX(0);
  }

  .mobile-back-btn {
    display: flex;
  }
}
</style>
