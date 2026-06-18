import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messageApi, type FriendInfo, type FriendRequest, type Conversation, type ChatMessage } from '@/api/message'

export const useMessageStore = defineStore('message', () => {
  // ========== 本地 Mock 数据定义 ==========
  const mockFriends: FriendInfo[] = [
    { 
      id: 101, 
      username: "林舒婷 (AI助教)", 
      avatarUrl: "", 
      bio: "你的专属AI学习助手，有任何学习规划问题都可以向我提问哦~", 
      online: true, 
      lastMessage: "你好！我是你的专属AI学习助教，本周的个性化学习报告已经准备好了，请注意查收。", 
      lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(), 
      unreadCount: 1 
    },
    { 
      id: 102, 
      username: "张明宇", 
      avatarUrl: "", 
      bio: "知序智学优秀学员 | 正在积极备战高考物理中", 
      online: true, 
      lastMessage: "这道几何题的辅助线怎么做？能教教我吗？", 
      lastMessageTime: new Date(Date.now() - 60 * 60000).toISOString(), 
      unreadCount: 2 
    },
    { 
      id: 103, 
      username: "陈晓东", 
      avatarUrl: "", 
      bio: "沉学在考研数学的苦海中，争取一战上岸！", 
      online: true, 
      lastMessage: "暂无消息", 
      lastMessageTime: "", 
      unreadCount: 0 
    },
    { 
      id: 104, 
      username: "刘雅琪", 
      avatarUrl: "", 
      bio: "今天又是充满斗志、元气满满的一天！", 
      online: false, 
      lastMessage: "谢谢你的分享，刚才发我的那份备考资料很有用！", 
      lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(), 
      unreadCount: 0 
    },
    { 
      id: 105, 
      username: "王伟", 
      avatarUrl: "", 
      bio: "单词打卡第231天，英语四六级必过！", 
      online: false, 
      lastMessage: "暂无消息", 
      lastMessageTime: "", 
      unreadCount: 0 
    }
  ]

  const mockConversations: Conversation[] = [
    { 
      friendId: 101, 
      friendUsername: "林舒婷 (AI助教)", 
      friendAvatarUrl: "", 
      lastMessage: "你好！我是你的专属AI学习助教，本周的个性化学习报告已经准备好了，请注意查收。", 
      lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(), 
      unreadCount: 1 
    },
    { 
      friendId: 102, 
      friendUsername: "张明宇", 
      friendAvatarUrl: "", 
      lastMessage: "这道几何题的辅助线怎么做？能教教我吗？", 
      lastMessageTime: new Date(Date.now() - 60 * 60000).toISOString(), 
      unreadCount: 2 
    },
    { 
      friendId: 104, 
      friendUsername: "刘雅琪", 
      friendAvatarUrl: "", 
      lastMessage: "谢谢你的分享，刚才发我的那份备考资料很有用！", 
      lastMessageTime: new Date(Date.now() - 24 * 3600000).toISOString(), 
      unreadCount: 0 
    }
  ]

  const mockFriendRequests: FriendRequest[] = [
    { 
      id: 501, 
      fromUserId: 201, 
      fromUsername: "赵敏", 
      fromAvatarUrl: "", 
      toUserId: 1, 
      message: "你好，我是你的同班同学，加个好友一起在知序学习打卡吧！", 
      status: "pending", 
      createdAt: new Date(Date.now() - 3600000).toISOString() 
    },
    { 
      id: 502, 
      fromUserId: 202, 
      fromUsername: "李建国", 
      fromAvatarUrl: "", 
      toUserId: 1, 
      message: "学习空间‘考研英语打卡群’群主，加个好友拉你进群探讨交流。", 
      status: "pending", 
      createdAt: new Date(Date.now() - 7200000).toISOString() 
    }
  ]

  const mockChatMessagesMap = new Map<number, ChatMessage[]>()
  mockChatMessagesMap.set(101, [
    { 
      id: 1, 
      senderId: 101, 
      receiverId: 1, 
      content: "同学你好，我是知序智学AI助教林舒婷，非常高兴能辅助你的日常学习！你可以向我询问学习规划、任务调整或寻求学科辅导。", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 15 * 60000).toISOString() 
    },
    { 
      id: 2, 
      senderId: 1, 
      receiverId: 101, 
      content: "你好，请问我的个性化学习方案在哪里可以看？", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 10 * 60000).toISOString() 
    },
    { 
      id: 3, 
      senderId: 101, 
      receiverId: 1, 
      content: "你可以在【总学习指挥台】或者【成长画像】中查看详细数据。我刚刚为你优化了本周的任务规划，主要是加强了数学几何部分的巩固练习，为你推送了专属测试题。", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 5 * 60000).toISOString() 
    }
  ])
  mockChatMessagesMap.set(102, [
    { 
      id: 11, 
      senderId: 102, 
      receiverId: 1, 
      content: "哈罗，今天做的那道高考数学几何模拟题好难啊，卡住我大半个下午。", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 120 * 60000).toISOString() 
    },
    { 
      id: 12, 
      senderId: 1, 
      receiverId: 102, 
      content: "是哪一道？把图发我，我们可以一起探讨探讨。", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 90 * 60000).toISOString() 
    },
    { 
      id: 13, 
      senderId: 102, 
      receiverId: 1, 
      content: "就是第二道大题，这道几何题的辅助线怎么做？能教教我吗？", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 60 * 60000).toISOString() 
    }
  ])
  mockChatMessagesMap.set(104, [
    { 
      id: 21, 
      senderId: 104, 
      receiverId: 1, 
      content: "哈罗，你上次说的那份《考研英语核心词汇精选》资料发我一份呗？", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 25 * 3600000).toISOString() 
    },
    { 
      id: 22, 
      senderId: 1, 
      receiverId: 104, 
      content: "发你啦，去云盘下载即可。", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 24.5 * 3600000).toISOString() 
    },
    { 
      id: 23, 
      senderId: 104, 
      receiverId: 1, 
      content: "谢谢你的分享，刚才发我的那份备考资料很有用！", 
      type: "text", 
      status: "read", 
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString() 
    }
  ])

  // ========== 状态 ==========
  const friends = ref<FriendInfo[]>(mockFriends)
  const friendRequests = ref<FriendRequest[]>(mockFriendRequests)
  const conversations = ref<Conversation[]>(mockConversations)
  const currentChatFriendId = ref<number | null>(null)
  const chatMessages = ref<Map<number, ChatMessage[]>>(mockChatMessagesMap)
  const unreadCount = ref(3) // 1 from LST + 2 from ZMY
  const loading = ref(false)

  // ========== 计算属性 ==========
  const onlineFriends = computed(() => friends.value.filter(f => f.online))
  const offlineFriends = computed(() => friends.value.filter(f => !f.online))
  const pendingRequests = computed(() => friendRequests.value.filter(r => r.status === 'pending'))

  const currentMessages = computed(() => {
    if (!currentChatFriendId.value) return []
    return chatMessages.value.get(currentChatFriendId.value) || []
  })

  // ========== 好友相关方法 ==========

  /** 获取好友列表 */
  async function fetchFriends() {
    loading.value = true
    try {
      const data = await messageApi.getFriends()
      if (data && data.length > 0) {
        friends.value = data
      }
    } catch (error) {
      console.warn('获取好友列表 API 失败，降级使用本地 Mock 数据:', error)
    } finally {
      loading.value = false
    }
  }

  /** 搜索用户 */
  async function searchUsers(keyword: string, type: 'username' | 'phone' = 'username') {
    try {
      const data = await messageApi.searchUsers({ keyword, type })
      if (data && data.length > 0) return data
    } catch (error) {
      console.warn('搜索用户 API 失败，使用本地模糊查询逻辑替代:', error)
    }

    // 默认模糊查询备用库
    const mockSearchableUsers = [
      { id: 301, username: "周杰伦", bio: "哎哟，不错哦，加个好友一起探讨音乐与高效学习吧~", phone: "13800138000" },
      { id: 302, username: "迪丽热巴", bio: "知序智学冲刺打卡中，一起努力加油吧！", phone: "13900139000" },
      { id: 303, username: "马云", bio: "今天很残酷，明天更残酷，后天很美好。一起交流创业思维。", phone: "18888888888" },
      { id: 304, username: "雷军", bio: "Are you OK? 智能学习操作系统非常好用，加好友交流！", phone: "16666666666" },
      { id: 305, username: "李白", bio: "大鹏一日同风起，扶摇直上九万里。邀君共饮共学。", phone: "17777777777" }
    ]

    const val = keyword.trim().toLowerCase()
    if (!val) return []
    return mockSearchableUsers.filter(u => 
      u.username.toLowerCase().includes(val) || 
      (u.phone && u.phone.includes(val))
    )
  }

  /** 发送好友请求 */
  async function sendFriendRequest(toUserId: number, message?: string) {
    try {
      await messageApi.sendFriendRequest(toUserId, message)
    } catch (error) {
      console.warn('发送好友请求 API 失败，执行本地模拟发送:', error)
    }
  }

  /** 获取好友请求列表 */
  async function fetchFriendRequests() {
    try {
      const data = await messageApi.getFriendRequests()
      if (data && data.length > 0) {
        friendRequests.value = data
      }
    } catch (error) {
      console.warn('获取好友请求列表 API 失败，降级使用本地 Mock 数据:', error)
    }
  }

  /** 接受好友请求 */
  async function acceptRequest(requestId: number) {
    try {
      await messageApi.acceptFriendRequest(requestId)
    } catch (error) {
      console.warn('接受好友请求 API 失败，执行本地 Mock 接受:', error)
    }

    const req = friendRequests.value.find(r => r.id === requestId)
    if (req) {
      // 本地加到好友列表中
      if (!friends.value.some(f => f.id === req.fromUserId)) {
        friends.value.unshift({
          id: req.fromUserId,
          username: req.fromUsername,
          avatarUrl: req.fromAvatarUrl,
          bio: "通过好友请求添加",
          online: true
        })
      }
    }
    friendRequests.value = friendRequests.value.map(r =>
      r.id === requestId ? { ...r, status: 'accepted' as const } : r
    )
  }

  /** 拒绝好友请求 */
  async function rejectRequest(requestId: number) {
    try {
      await messageApi.rejectFriendRequest(requestId)
    } catch (error) {
      console.warn('拒绝好友请求 API 失败，执行本地 Mock 拒绝:', error)
    }

    friendRequests.value = friendRequests.value.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    )
  }

  /** 删除好友 */
  async function deleteFriend(friendId: number) {
    try {
      await messageApi.deleteFriend(friendId)
    } catch (error) {
      console.warn('删除好友 API 失败，执行本地 Mock 删除:', error)
    }

    friends.value = friends.value.filter(f => f.id !== friendId)
    conversations.value = conversations.value.filter(c => c.friendId !== friendId)
    chatMessages.value.delete(friendId)
  }

  // ========== 消息相关方法 ==========

  /** 获取会话列表 */
  async function fetchConversations() {
    try {
      const data = await messageApi.getConversations()
      if (data && data.length > 0) {
        conversations.value = data
      }
    } catch (error) {
      console.warn('获取会话列表 API 失败，降级使用本地 Mock 数据:', error)
    }
  }

  /** 获取聊天记录 */
  async function fetchChatMessages(friendId: number, page = 1, size = 20) {
    try {
      const data = await messageApi.getChatMessages(friendId, { page, size })
      if (data?.records && data.records.length > 0) {
        const existing = chatMessages.value.get(friendId) || []
        if (page === 1) {
          chatMessages.value.set(friendId, data.records)
        } else {
          chatMessages.value.set(friendId, [...data.records, ...existing])
        }
      }
    } catch (error) {
      console.warn(`获取聊天记录 API 失败 (好友:${friendId})，降级使用本地 Mock 聊天记录:`, error)
      if (!chatMessages.value.has(friendId)) {
        chatMessages.value.set(friendId, [])
      }
    }
  }

  /** 发送消息 */
  async function sendMessage(receiverId: number, content: string, type: 'text' | 'image' | 'file' = 'text') {
    try {
      const message = await messageApi.sendMessage({ receiverId, content, type })
      if (message) {
        const messages = chatMessages.value.get(receiverId) || []
        messages.push(message)
        chatMessages.value.set(receiverId, messages)

        // 更新会话列表
        const convIndex = conversations.value.findIndex(c => c.friendId === receiverId)
        if (convIndex >= 0) {
          conversations.value[convIndex].lastMessage = content
          conversations.value[convIndex].lastMessageTime = message.createdAt
        }
        return message
      }
    } catch (error) {
      console.warn('发送消息 API 失败，执行本地模拟发送并更新视图:', error)
    }

    // 本地降级发送模式
    const mockMsg: ChatMessage = {
      id: Math.floor(Math.random() * 1000000),
      senderId: 1, // current user ID mock
      receiverId,
      content,
      type,
      status: 'sent',
      createdAt: new Date().toISOString()
    }
    const msgs = chatMessages.value.get(receiverId) || []
    msgs.push(mockMsg)
    chatMessages.value.set(receiverId, msgs)

    // 更新最近会话列表
    const convIndex = conversations.value.findIndex(c => c.friendId === receiverId)
    if (convIndex >= 0) {
      conversations.value[convIndex].lastMessage = content
      conversations.value[convIndex].lastMessageTime = mockMsg.createdAt
    } else {
      const friend = friends.value.find(f => f.id === receiverId)
      conversations.value.unshift({
        friendId: receiverId,
        friendUsername: friend?.username || "未知好友",
        friendAvatarUrl: friend?.avatarUrl,
        lastMessage: content,
        lastMessageTime: mockMsg.createdAt,
        unreadCount: 0
      })
    }
    return mockMsg
  }

  /** 标记消息已读 */
  async function markRead(friendId: number) {
    try {
      await messageApi.markMessagesRead(friendId)
    } catch (error) {
      console.warn('标记已读 API 失败，执行本地标记已读:', error)
    }

    // 更新本地未读数
    const conv = conversations.value.find(c => c.friendId === friendId)
    if (conv) {
      unreadCount.value = Math.max(0, unreadCount.value - conv.unreadCount)
      conv.unreadCount = 0
    }
    const friend = friends.value.find(f => f.id === friendId)
    if (friend) {
      friend.unreadCount = 0
    }
  }

  /** 获取未读消息数 */
  async function fetchUnreadCount() {
    try {
      const count = await messageApi.getUnreadCount()
      if (count !== undefined) {
        unreadCount.value = count
      }
    } catch (error) {
      console.warn('获取未读数 API 失败，保留本地计算的未读数')
    }
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
    const conv = conversations.value.find(c => c.friendId === senderId)
    if (conv) {
      conv.lastMessage = message.content
      conv.lastMessageTime = message.createdAt
      if (currentChatFriendId.value !== senderId) {
        conv.unreadCount++
        unreadCount.value++
      }
    } else {
      const friend = friends.value.find(f => f.id === senderId)
      conversations.value.unshift({
        friendId: senderId,
        friendUsername: friend?.username || "未知好友",
        friendAvatarUrl: friend?.avatarUrl,
        lastMessage: message.content,
        lastMessageTime: message.createdAt,
        unreadCount: currentChatFriendId.value !== senderId ? 1 : 0
      })
      if (currentChatFriendId.value !== senderId) {
        unreadCount.value++
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
    rejectRequest,
    deleteFriend,
    // 消息方法
    fetchConversations,
    fetchChatMessages,
    sendMessage,
    markRead,
    fetchUnreadCount,
    setCurrentChat,
    receiveMessage,
    reset
  }
})
