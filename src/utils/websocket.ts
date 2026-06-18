import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { refreshAccessToken } from '@/api/request'

class ChatWebSocket {
    private ws: WebSocket | null = null;
    private baseUrl: string = 'ws://localhost:9015/ws/chat';
    private pingInterval: number | null = null;
    private reconnectTimeout: number | null = null;
    private isRefreshing: boolean = false; // 是否正在刷新 token

    // 连接状态
    public isConnected: boolean = false;

    // 连接方法
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

        // 使用路径参数方式传递 token（适配后端 @PathParam("token")）
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

        // 开启心跳
        this.startHeartbeat();
    }

    private onMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);

            // 处理心跳响应（后端返回的是纯文本 "pong"）
            if (data.type === 'pong' || data.msgType === 'PONG') {
                return;
            }

            console.log('[WebSocket] Receive message:', data);

            // 检查是否是 401 认证错误
            if (data.code === 401) {
                this.handleTokenExpired(data.msg || '登录已过期');
                return;
            }

            // 如果是系统错误提示
            if (data.msgType === 'ERROR_TIP') {
                ElMessage.error(data.content);
                return;
            }

            // 分发消息类型给其他组件
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
     * 通过自定义事件实现组件间通信
     */
    private dispatchMessage(data: any) {
        const { msgType, type } = data;
        const messageType = msgType || type;

        // 聊天消息
        if (messageType === 'CHAT_MESSAGE') {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'CHAT_MESSAGE', data: data.data || data }
            }));
            return;
        }

        // 好友请求
        if (messageType === 'FRIEND_REQUEST') {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'FRIEND_REQUEST', data: data.data || data }
            }));
            return;
        }

        // 消息已读回执
        if (messageType === 'MESSAGE_READ') {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'MESSAGE_READ', data: data.data || data }
            }));
            return;
        }

        // 其他系统消息
        if (data.content) {
            window.dispatchEvent(new CustomEvent('ws-message', {
                detail: { type: 'SYSTEM', data: data }
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

        // 断线重连(如果是正常关闭则不重连，这里先简单通过错误码判断)
        if (event.code !== 1000) {
            this.reconnect();
        }
    }

    private onError(error: Event) {
        console.error('[WebSocket] Error:', error);
    }

    /**
     * 处理 Token 过期
     * 尝试刷新 accessToken 并重新连接，失败则跳转登录页
     */
    private async handleTokenExpired(msg: string) {
        if (this.isRefreshing) {
            console.log('[WebSocket] Token refresh already in progress, skipping...');
            return;
        }

        this.isRefreshing = true;
        console.log('[WebSocket] Token expired, attempting to refresh...');

        try {
            // 调用 accessToken 刷新函数
            const newAccessToken = await refreshAccessToken();

            // 更新 store 中的 accessToken
            const userStore = useUserStore();
            userStore.setToken(newAccessToken);

            ElMessage.success('Token 已刷新，正在重新连接...');

            // 延迟一下再重连，确保后端已处理
            setTimeout(() => {
                this.connect();
            }, 500);
        } catch (error) {
            console.error('[WebSocket] Failed to refresh token:', error);
            ElMessage.error(msg || '登录已过期，请重新登录');

            // 清理本地状态并跳转登录页
            const userStore = useUserStore();
            userStore.logout();

            window.location.href = '/login';
        } finally {
            this.isRefreshing = false;
        }
    }

    // 心跳机制
    private startHeartbeat() {
        this.stopHeartbeat();
        // 每 30 秒发送一次心跳
        this.pingInterval = window.setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // 后端期望纯文本 "ping"
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

    // 重连逻辑
    private reconnect() {
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
        }

        // 5秒后重连
        this.reconnectTimeout = window.setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            this.connect();
        }, 5000);
    }

    // 发送消息
    public sendMessage(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('[WebSocket] Not connected');
            ElMessage.warning('连接已断开，消息发送失败');
        }
    }

    // 断开连接（用户登出时）
    public disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'User logout');
            this.ws = null;
        }
    }
}

export const chatWebSocket = new ChatWebSocket();