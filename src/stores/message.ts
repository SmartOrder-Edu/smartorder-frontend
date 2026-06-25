import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messageApi, type FriendVO, type FriendRequest, type Conversation, type ChatMessage, type UserVO } from '@/api/message'
import { chatWebSocket } from '@/utils/websocket'
import { useUserStore } from './user'

export const useMessageStore = defineStore('message', () => {
  // ========== 状态 ==========
  const friends = ref<FriendVO[]>([])
  const friendRequests = ref<FriendRequest[]>([])
  const conversations = ref<Conversation[]>([])
  const currentChatFriendId = ref<number | null>(null)
  const chatMessages = ref<Map<number, ChatMessage[]>>(new Map())
  const unreadCount = ref(0)
  const loading = ref(false)

  // ========== 计算属性 ==========
  const onlineFriends = computed(() => friends.value.filter(f => f.status === 1))
  const offlineFriends = computed(() => friends.value.filter(f => f.status !== 1))
  const pendingRequests = computed(() => friendRequests.value.filter(r => r.status === 0))

  const currentMessages = computed(() => {
    if (!currentChatFriendId.value) return []
    return chatMessages.value.get(currentChatFriendId.value) || []
  })

  // ========== 好友相关方法 ==========

  /** 获取好友列表 */
  async function fetchFriends() {
    loading.value = true
    try {
      const data = await messageApi.getFriendDetailList()
      if (data && data.length > 0) {
        friends.value = data
      }
    } catch (error) {
      console.warn('获取好友列表 API 失败:', error)
    } finally {
      loading.value = false
    }
  }

  /** 搜索用户 */
  async function searchUsers(keyword: string): Promise<UserVO[]> {
    try {
      const data = await messageApi.searchUsers(keyword)
      if (data && data.length > 0) return data
    } catch (error) {
      console.warn('搜索用户 API 失败:', error)
    }
    return []
  }

  /** 发送好友请求 */
  async function sendFriendRequest(receiverId: number, requestMsg?: string) {
    try {
      await messageApi.sendFriendRequest(receiverId, requestMsg)
    } catch (error) {
      console.warn('发送好友请求 API 失败:', error)
      throw error
    }
  }

  /** 获取好友请求列表 */
  async function fetchFriendRequests() {
    try {
      const data = await messageApi.getPendingRequests()
      if (data && data.length > 0) {
        friendRequests.value = data
      }
    } catch (error) {
      console.warn('获取好友请求列表 API 失败:', error)
    }
  }

  /** 接受好友请求 */
  async function acceptRequest(requestId: number) {
    try {
      await messageApi.acceptFriendRequest(requestId)
    } catch (error) {
      console.warn('接受好友请求 API 失败:', error)
      throw error
    }

    const req = friendRequests.value.find(r => r.id === requestId)
    if (req) {
      // 更新请求状态
      friendRequests.value = friendRequests.value.map(r =>
        r.id === requestId ? { ...r, status: 1 } : r
      )
      // 刷新好友列表
      await fetchFriends()
    }
  }

  /** 删除好友 */
  async function deleteFriend(friendId: number) {
    try {
      await messageApi.deleteFriend(friendId)
    } catch (error) {
      console.warn('删除好友 API 失败:', error)
      throw error
    }

    friends.value = friends.value.filter(f => f.id !== friendId)
    conversations.value = conversations.value.filter(c => c.friendId !== friendId)
    chatMessages.value.delete(friendId)
  }

  /** 拉黑好友 */
  async function blockFriend(friendId: number) {
    try {
      await messageApi.blockFriend(friendId)
    } catch (error) {
      console.warn('拉黑好友 API 失败:', error)
      throw error
    }

    const friend = friends.value.find(f => f.id === friendId)
    if (friend) {
      friend.status = 3
    }
  }

  /** 设置好友备注 */
  async function setFriendAlias(friendId: number, alias?: string) {
    try {
      await messageApi.setFriendAlias(friendId, alias)
    } catch (error) {
      console.warn('设置好友备注 API 失败:', error)
      throw error
    }

    const friend = friends.value.find(f => f.id === friendId)
    if (friend) {
      friend.friendAlias = alias || undefined
    }
  }

  /** 批量获取好友在线状态 */
  async function fetchFriendsOnlineStatus(friendIds: number[]) {
    try {
      const statusMap = await messageApi.getBatchFriendOnlineStatus(friendIds)
      if (statusMap) {
        friends.value.forEach(f => {
          if (friendIds.includes(f.id)) {
            const isOnline = statusMap instanceof Map ? statusMap.get(f.id) : (statusMap as any)[f.id]
            if (isOnline !== undefined) {
              // 可以在FriendVO中添加online字段，或者使用其他方式存储
            }
          }
        })
      }
    } catch (error) {
      console.warn('获取好友在线状态 API 失败:', error)
    }
  }

  // ========== 消息相关方法 ==========

  /** 获取会话列表 */
  async function fetchConversations() {
    try {
      const data = await messageApi.getConversations()
      if (data && data.length > 0) {
        // 后端返回的是ChatMessage[]，需要转换为Conversation[]
        const conversationMap = new Map<number, Conversation>()
        
        data.forEach((msg: ChatMessage) => {
          const userStore = useUserStore()
          const currentUserId = userStore.userInfo?.id || 0
          const friendId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
          
          if (!conversationMap.has(friendId)) {
            const friend = friends.value.find(f => f.id === friendId)
            conversationMap.set(friendId, {
              friendId,
              friendUsername: friend?.username || `用户${friendId}`,
              friendAvatarUrl: friend?.avatarUrl || '',
              lastMessage: msg.content,
              lastMessageTime: msg.createTime,
              unreadCount: msg.senderId !== currentUserId && msg.status === 0 ? 1 : 0
            })
          } else {
            const conv = conversationMap.get(friendId)!
            if (new Date(msg.createTime) > new Date(conv.lastMessageTime)) {
              conv.lastMessage = msg.content
              conv.lastMessageTime = msg.createTime
            }
            if (msg.senderId !== currentUserId && msg.status === 0) {
              conv.unreadCount++
            }
          }
        })
        
        conversations.value = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      }
    } catch (error) {
      console.warn('获取会话列表 API 失败:', error)
    }
  }

  /** 获取聊天记录 */
  async function fetchChatMessages(targetTeacherId: number, page = 1, size = 20) {
    try {
      const data = await messageApi.getChatMessages(targetTeacherId, { page, size })
      if (data?.records && data.records.length > 0) {
        const existing = chatMessages.value.get(targetTeacherId) || []
        if (page === 1) {
          chatMessages.value.set(targetTeacherId, data.records)
        } else {
          chatMessages.value.set(targetTeacherId, [...data.records, ...existing])
        }
      } else if (page === 1) {
        chatMessages.value.set(targetTeacherId, [])
      }
    } catch (error) {
      console.warn(`获取聊天记录 API 失败 (好友:${targetTeacherId}):`, error)
      if (!chatMessages.value.has(targetTeacherId)) {
        chatMessages.value.set(targetTeacherId, [])
      }
    }
  }

  /** 发送消息（通过WebSocket） */
  async function sendMessage(receiverId: number, content: string, msgType: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE' = 'TEXT') {
    // 通过WebSocket发送
    chatWebSocket.sendMessage({ receiverId, msgType, content })

    // 乐观更新本地消息列表
    const userStore = useUserStore()
    const currentUserId = userStore.userInfo?.id || 0
    
    const newMsg: ChatMessage = {
      id: Date.now(), // 临时ID
      senderId: currentUserId,
      receiverId,
      msgType,
      content,
      status: 0,
      createTime: new Date().toISOString()
    }

    const msgs = chatMessages.value.get(receiverId) || []
    msgs.push(newMsg)
    chatMessages.value.set(receiverId, msgs)

    // 更新会话列表
    updateConversation(receiverId, content, newMsg.createTime)

    return newMsg
  }

  /** 更新会话列表 */
  function updateConversation(friendId: number, lastMessage: string, lastMessageTime: string) {
    const convIndex = conversations.value.findIndex(c => c.friendId === friendId)
    const friend = friends.value.find(f => f.id === friendId)
    
    if (convIndex >= 0) {
      conversations.value[convIndex].lastMessage = lastMessage
      conversations.value[convIndex].lastMessageTime = lastMessageTime
    } else {
      conversations.value.unshift({
        friendId,
        friendUsername: friend?.username || `用户${friendId}`,
        friendAvatarUrl: friend?.avatarUrl || '',
        lastMessage,
        lastMessageTime,
        unreadCount: 0
      })
    }
    
    // 按时间排序
    conversations.value.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }

  /** 标记消息已读 */
  async function markRead(senderId: number) {
    try {
      await messageApi.markMessagesRead(senderId)
    } catch (error) {
      console.warn('标记已读 API 失败:', error)
    }

    // 更新本地消息状态
    const msgs = chatMessages.value.get(senderId) || []
    msgs.forEach(msg => {
      if (msg.status === 0) {
        msg.status = 1
      }
    })

    // 更新会话未读数
    const conv = conversations.value.find(c => c.friendId === senderId)
    if (conv) {
      unreadCount.value = Math.max(0, unreadCount.value - conv.unreadCount)
      conv.unreadCount = 0
    }
  }

  /** 撤回消息 */
  async function recallMessage(messageId: number, friendId: number) {
    try {
      await messageApi.recallMessage(messageId)
    } catch (error) {
      console.warn('撤回消息 API 失败:', error)
      throw error
    }

    // 更新本地消息状态
    const msgs = chatMessages.value.get(friendId) || []
    const msg = msgs.find(m => m.id === messageId)
    if (msg) {
      msg.status = 2
    }
  }

  /** 获取未读消息数 */
  async function fetchUnreadCount() {
    // 从会话列表中计算未读数
    let count = 0
    conversations.value.forEach(conv => {
      count += conv.unreadCount
    })
    unreadCount.value = count
  }

  /** 设置当前聊天好友 */
  function setCurrentChat(friendId: number | null) {
    currentChatFriendId.value = friendId
    if (friendId) {
      markRead(friendId)
    }
  }

  /** 接收实时消息 */
  function receiveMessage(message: ChatMessage) {
    const { senderId } = message
    const msgs = chatMessages.value.get(senderId) || []
    msgs.push(message)
    chatMessages.value.set(senderId, msgs)

    // 更新会话列表
    updateConversation(senderId, message.content, message.createTime)

    // 如果不是当前聊天窗口，增加未读数
    if (currentChatFriendId.value !== senderId) {
      unreadCount.value++
      const conv = conversations.value.find(c => c.friendId === senderId)
      if (conv) {
        conv.unreadCount++
      }
    }
  }

  /** 清空状态 */
  function reset() {
    friends.value = []
    friendRequests.value = []
    conversations.value = []
    currentChatFriendId.value = null
    chatMessages.value.clear()
    unreadCount.value = 0
  }

  return {
    // 状态
    friends,
    friendRequests,
    conversations,
    currentChatFriendId,
    chatMessages,
    unreadCount,
    loading,
    // 计算属性
    onlineFriends,
    offlineFriends,
    pendingRequests,
    currentMessages,
    // 好友方法
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    fetchFriendRequests,
    acceptRequest,
    deleteFriend,
    blockFriend,
    setFriendAlias,
    fetchFriendsOnlineStatus,
    // 消息方法
    fetchConversations,
    fetchChatMessages,
    sendMessage,
    markRead,
    recallMessage,
    fetchUnreadCount,
    setCurrentChat,
    receiveMessage,
    reset
  }
})
