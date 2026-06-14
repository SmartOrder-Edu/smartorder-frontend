import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { refreshShortToken } from '@/api/request'

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
        const shortToken = userStore.shortToken;

        if (!shortToken) {
            console.error('No shortToken found, unable to connect to WebSocket');
            return;
        }

        const wsUrl = `${this.baseUrl}/${shortToken}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = this.onOpen.bind(this);
            this.ws.onmessage = this.onMessage.bind(this);
            this.ws.onclose = this.onClose.bind(this);
            this.ws.onerror = this.onError.bind(this);
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    private onOpen() {
        console.log('WebSocket connection established');
        this.isConnected = true;
        
        // 开启心跳
        this.startHeartbeat();
    }

    private onMessage(event: MessageEvent) {
        if (event.data === 'pong') {
            // 收到心跳响应，不做特殊处理
            return;
        }

        try {
            const data = JSON.parse(event.data);
            console.log('Receive WebSocket message:', data);

            // 检查是否是 401 认证错误
            if (data.code === 401) {
                this.handleTokenExpired(data.msg || '登录已过期');
                return;
            }

            // 如果是系统错误提示
            if (data.msgType === 'ERROR_TIP') {
                ElMessage.error(data.content);
            }

            // 可以通过事件总线(EventBus)或Pinia把消息分发给其他组件
        } catch (error) {
            console.error('Failed to parse WebSocket message:', event.data);
        }
    }

    private onClose(event: CloseEvent) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // 1008 是 Token 过期的关闭码
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
        console.error('WebSocket error:', error);
    }

    /**
     * 处理 Token 过期
     * 尝试刷新 shortToken 并重新连接，失败则跳转登录页
     */
    private async handleTokenExpired(msg: string) {
        if (this.isRefreshing) {
            console.log('Token refresh already in progress, skipping...');
            return;
        }

        this.isRefreshing = true;
        console.log('Token expired, attempting to refresh...');

        try {
            // 调用 shortToken 刷新函数
            const newShortToken = await refreshShortToken();

            // 更新 store 中的 shortToken
            const userStore = useUserStore();
            userStore.setShortToken(newShortToken);

            ElMessage.success('Token 已刷新，正在重新连接...');

            // 延迟一下再重连，确保后端已处理
            setTimeout(() => {
                this.connect();
            }, 500);
        } catch (error) {
            console.error('Failed to refresh token:', error);
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
            console.log('Attempting to reconnect WebSocket...');
            this.connect();
        }, 5000);
    }

    // 发送消息
    public sendMessage(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
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