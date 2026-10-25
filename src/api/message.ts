import request from './request'

// ========== 匹配后端的数据结构 ==========

export interface UserVO {
  id: number
  username: string
  email?: string
  phone?: string
  avatarUrl?: string
  gender?: number
  birthday?: string
  bio?: string
  role?: number
  vipLevel?: number
  vipStartTime?: string
  vipExpireTime?: string
  status?: number
}

export interface FriendVO extends UserVO {
  friendAlias?: string
  status?: number // 好友状态: 1-正常, 2-单向删除, 3-拉黑
}

export interface FriendRequest {
  id: number
  senderId: number
  receiverId: number
  requestMsg?: string
  status: number // 0-待处理, 1-已同意, 2-已拒绝, 3-已忽略
  createTime: string
  updateTime?: string
}

export interface Conversation {
  friendId: number
  friendUsername: string
  friendAvatarUrl?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface ChatMessage {
  id: number
  senderId: number
  receiverId: number
  msgType: 'TEXT' | 'IMAGE' | 'VOICE' | 'FILE'
  content: string
  status: number // 0-未读, 1-已读, 2-撤回
  createTime: string
  revokeAt?: string
}

export const messageApi = {
  // ========== 好友相关 ==========

  /** 获取好友详细列表 */
  getFriendDetailList() {
    return request.get<FriendVO[]>('/friend/detail-list')
  },

  /** 搜索用户 */
  searchUsers(keyword: string) {
    return request.get<UserVO[]>('/friend/search', { params: { keyword } })
  },

  /** 发送好友请求 */
  sendFriendRequest(receiverId: number, requestMsg?: string) {
    return request.post<string>('/friend/request', null, {
      params: { receiverId, requestMsg }
    })
  },

  /** 获取待处理好友请求列表 */
  getPendingRequests() {
    return request.get<FriendRequest[]>('/friend/pending-requests')
  },

  /** 接受好友请求 */
  acceptFriendRequest(requestId: number) {
    return request.put<string>(`/friend/accept/${requestId}`)
  },

  /** 删除好友 */
  deleteFriend(friendId: number) {
    return request.delete<string>(`/friend/${friendId}`)
  },

  /** 拉黑好友 */
  blockFriend(friendId: number) {
    return request.put<string>(`/friend/block/${friendId}`)
  },

  /** 设置好友备注 */
  setFriendAlias(friendId: number, alias?: string) {
    return request.put<string>(`/friend/alias/${friendId}`, null, {
      params: { alias }
    })
  },

  /** 批量获取好友在线状态 */
  getBatchFriendOnlineStatus(friendIds: number[]) {
    return request.post<Map<number, boolean>>('/friend/online-status/batch', friendIds)
  },

  // ========== 消息相关 ==========

  /** 获取会话列表 */
  getConversations() {
    return request.get<ChatMessage[]>('/user/chat/conversations')
  },

  /** 获取与好友的聊天记录（分页） */
  getChatMessages(targetTeacherId: number, params?: { page?: number; size?: number }) {
    return request.get<{ records: ChatMessage[]; total: number }>('/user/chat/history', {
      params: { targetTeacherId, ...params }
    })
  },

  /** 标记消息已读 */
  markMessagesRead(senderId: number) {
    return request.put<string>('/user/chat/read', null, {
      params: { senderId }
    })
  },

  /** 撤回消息 */
  recallMessage(messageId: number) {
    return request.put<string>(`/user/chat/recall/${messageId}`)
  },

  /** 上传聊天文件 */
  uploadChatFile(file: File, msgType: 'IMAGE' | 'VOICE' | 'FILE') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('msgType', msgType)
    return request.post<string>('/user/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default messageApi
