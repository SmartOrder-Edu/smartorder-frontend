import request from './request'

export interface FriendInfo {
  id: number
  username: string
  avatarUrl?: string
  bio?: string
  online?: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export interface FriendRequest {
  id: number
  fromUserId: number
  fromUsername: string
  fromAvatarUrl?: string
  toUserId: number
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
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
  content: string
  type: 'text' | 'image' | 'file'
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
}

export interface SearchUserParams {
  keyword: string
  type: 'username' | 'phone'
}

export interface SendMessageParams {
  receiverId: number
  content: string
  type?: 'text' | 'image' | 'file'
}

export const messageApi = {
  // ========== 好友相关 ==========

  /** 获取好友列表 */
  getFriends() {
    return request.get<FriendInfo[]>('/friends')
  },

  /** 搜索用户（用户名/手机号） */
  searchUsers(params: SearchUserParams) {
    return request.get<FriendInfo[]>('/friends/search', { params })
  },

  /** 发送好友请求 */
  sendFriendRequest(toUserId: number, message?: string) {
    return request.post<string>('/friends/request', { toUserId, message })
  },

  /** 获取好友请求列表 */
  getFriendRequests() {
    return request.get<FriendRequest[]>('/friends/requests')
  },

  /** 接受好友请求 */
  acceptFriendRequest(requestId: number) {
    return request.post<string>(`/friends/accept/${requestId}`)
  },

  /** 拒绝好友请求 */
  rejectFriendRequest(requestId: number) {
    return request.post<string>(`/friends/reject/${requestId}`)
  },

  /** 删除好友 */
  deleteFriend(friendId: number) {
    return request.delete<string>(`/friends/${friendId}`)
  },

  // ========== 消息相关 ==========

  /** 获取会话列表 */
  getConversations() {
    return request.get<Conversation[]>('/messages/conversations')
  },

  /** 获取与好友的聊天记录（分页） */
  getChatMessages(friendId: number, params?: { page?: number; size?: number }) {
    return request.get<{ records: ChatMessage[]; total: number }>(`/messages/${friendId}`, { params })
  },

  /** 发送消息 */
  sendMessage(params: SendMessageParams) {
    return request.post<ChatMessage>('/messages/send', params)
  },

  /** 标记消息已读 */
  markMessagesRead(friendId: number) {
    return request.put<string>(`/messages/read/${friendId}`)
  },

  /** 获取未读消息总数 */
  getUnreadCount() {
    return request.get<number>('/messages/unread/count')
  }
}

export default messageApi
