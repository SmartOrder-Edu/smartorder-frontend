import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { refreshAccessToken } from '@/api/request'

class ChatWebSocket {
    private ws: WebSocket | null = null;
    private baseUrl: string = 'ws://localhost:9015/ws/chat';
    private pingInterval: number | null = null;
    private reconnectTimeout: number | null = null;
    private isRefreshing: boolean = false;

    public isConnected: boolean = false;

    public connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        const userStore = useUserStore();
        const accessToken = userStore.token;

        console.log('[WebSocket] Attempting to connect with accessToken:', accessToken?.substring(0, 10) + '...');

        if (!accessToken) {
            console.error('[WebSocket] No accessToken found, unable to connect');
            return;
        }

        const wsUrl = `${this.baseUrl}/${accessToken}`;

        console.log('[WebSocket] Connecting to:', wsUrl.replace(accessToken, '***'));

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = this.onOpen.bind(this);
            this.ws.onmessage = this.onMessage.bind(this);
            this.ws.onclose = this.onClose.bind(this);
            this.ws.onerror = this.onError.bind(this);
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
        }
    }

    private onOpen() {
        console.log('[WebSocket] Connection established');
        this.isConnected = true;
        this.startHeartbeat();
    }

    private onMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);

            // 处理心跳响应
            if (data === 'pong' || data.type === 'pong' || data.msgType === 'PONG') {
                return;
            }

            console.log('[WebSocket] Receive message:', data);

            // 检查是否是 401 认证错误
            if (data.code === 401) {
                this.handleTokenExpired(data.msg || '登录已过期');
                return;
            }

            // 分发消息
            this.dispatchMessage(data);
        } catch (error) {
            // 解析失败，可能是纯文本心跳响应
            if (event.data === 'pong') {
                return;
            }
            console.error('[WebSocket] Failed to parse message:', event.data);
        }
    }

    /**
     * 分发消息给其他组件
     * 后端直接发送 ChatMessageDTO，格式为：
     * {
     *   messageId: 123,
     *   senderId: 1,
     *   receiverId: 2,
     *   msgType: "TEXT" | "IMAGE" | "VOICE" | "FILE" | "ERROR_TIP" | "FRIEND_REQUEST" | ...,
     *   content: "...",
     *   createTime: "2024-01-01T00:00:00"
     * }
     */
    private dispatchMessage(data: any) {
        const { msgType } = data;

        // 错误提示（被拉黑、被删等）
        if (msgType === 'ERROR_TIP') {
            ElMessage.error(data.content);
            return;
        }

        // 普通聊天消息 (TEXT, IMAGE, VOICE, FILE)
        if (['TEXT', 'IMAGE', 'VOICE', 'FILE'].includes(msgType)) {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'CHAT_MESSAGE', data }
            }));
            return;
        }

        // 好友请求通知
        if (msgType === 'FRIEND_REQUEST') {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'FRIEND_REQUEST', data }
            }));
            return;
        }

        // 消息已读回执
        if (msgType === 'MESSAGE_READ') {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'MESSAGE_READ', data }
            }));
            return;
        }

        // 通话信令
        if (['VIDEO_CALL_REQUEST', 'VOICE_CALL_REQUEST', 'CALL_ACCEPT', 
             'CALL_REJECT', 'CALL_CANCEL', 'CALL_END'].includes(msgType)) {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'CALL_SIGNAL', data }
            }));
            return;
        }

        // 其他系统消息
        if (data.content) {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'SYSTEM', data }
            }));
        }
    }

    private onClose(event: CloseEvent) {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // 1008 是 Token 过期的关闭码（VIOLATED_POLICY）
        if (event.code === 1008) {
            this.handleTokenExpired(event.reason || '登录已过期');
            return;
        }

        // 断线重连
        if (event.code !== 1000) {
            this.reconnect();
        }
    }

    private onError(error: Event) {
        console.error('[WebSocket] Error:', error);
    }

    private async handleTokenExpired(msg: string) {
        if (this.isRefreshing) {
            console.log('[WebSocket] Token refresh already in progress, skipping...');
            return;
        }

        this.isRefreshing = true;
        console.log('[WebSocket] Token expired, attempting to refresh...');

        try {
            const newAccessToken = await refreshAccessToken();

            const userStore = useUserStore();
            userStore.setToken(newAccessToken);

            ElMessage.success('Token 已刷新，正在重新连接...');

            setTimeout(() => {
                this.connect();
            }, 500);
        } catch (error) {
            console.error('[WebSocket] Failed to refresh token:', error);
            ElMessage.error(msg || '登录已过期，请重新登录');

            const userStore = useUserStore();
            userStore.logout();

            window.location.href = '/login';
        } finally {
            this.isRefreshing = false;
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.pingInterval = window.setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, 30000);
    }

    private stopHeartbeat() {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private reconnect() {
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
        }

        this.reconnectTimeout = window.setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            this.connect();
        }, 5000);
    }

    /**
     * 发送消息
     * 后端期望的格式：{ receiverId, msgType, content }
     */
    public sendMessage(data: { receiverId: number; msgType: string; content: string }) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('[WebSocket] Not connected');
            ElMessage.warning('连接已断开，消息发送失败');
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'User logout');
            this.ws = null;
        }
    }
}

export const chatWebSocket = new ChatWebSocket();
