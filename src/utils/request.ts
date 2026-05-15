import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

export interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean
}

class Request {
  private instance: AxiosInstance
  private baseURL: string
  private isRefreshing = false
  private pendingRequests: Array<(token: string) => void> = []

  constructor(config: AxiosRequestConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || '/api'
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      transformResponse: [(data) => {
        if (typeof data === 'string') {
          // 将超出JS安全整数范围的数字转为字符串，防止精度丢失
          data = data.replace(/([:(,]\s*)(-?\d{16,})(\s*[,})])/g, '$1"$2"$3')
        }
        try { return JSON.parse(data) } catch { return data }
      }],
      ...config
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response
        
        // 兼容后端直接返回非标准结构数据（如上传图片直接返回 OSS URL 字符串）
        if (typeof data === 'string' || (data && data.code === undefined)) {
          return data
        }

        if (data.code !== 200 && data.code !== 0) {
          ElMessage.error(data.msg || data.message || '请求失败')
          return Promise.reject(new Error(data.msg || data.message || '请求失败'))
        }
        return data.data
      },
      async (error) => {
        const { response, config } = error

        if (response?.status === 401 && config && !config._retry) {
          // refreshToken请求本身失败，不再重试
          if (config.url?.includes('/auth/refreshToken')) {
            this.handleRefreshFailure()
            return Promise.reject(error)
          }

          if (this.isRefreshing) {
            // 正在刷新，将请求加入等待队列
            return new Promise((resolve) => {
              this.pendingRequests.push((newToken: string) => {
                config.headers.Authorization = `Bearer ${newToken}`
                config._retry = true
                resolve(this.instance.request(config))
              })
            })
          }

          config._retry = true
          this.isRefreshing = true

          try {
            const newToken = await this.doRefreshToken()
            // 通知队列中所有等待的请求
            this.pendingRequests.forEach(cb => cb(newToken))
            this.pendingRequests = []
            // 重试原请求
            config.headers.Authorization = `Bearer ${newToken}`
            return this.instance.request(config)
          } catch (refreshError) {
            this.handleRefreshFailure()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // 其他错误处理
        if (response) {
          switch (response.status) {
            case 403:
              ElMessage.error('拒绝访问')
              break
            case 404:
              ElMessage.error('请求地址不存在')
              break
            case 500:
              ElMessage.error('服务器内部错误')
              break
            default:
              ElMessage.error(response.data?.msg || response.data?.message || '请求失败')
          }
        } else if (error.code === 'ECONNABORTED') {
          ElMessage.error('请求超时')
        } else {
          ElMessage.error('网络异常，请检查网络连接')
        }
        return Promise.reject(error)
      }
    )
  }

  private async doRefreshToken(): Promise<string> {
    const { data } = await axios.post(
      `${this.baseURL}/auth/refreshToken`,
      {},
      { withCredentials: true }
    )
    const newToken = data.data
    if (newToken) {
      localStorage.setItem('token', newToken)
      return newToken
    }
    throw new Error('刷新Token失败')
  }

  private handleRefreshFailure() {
    this.pendingRequests = []
    localStorage.removeItem('token')
    ElMessage.error('登录已过期，请重新登录')
    window.location.href = '/login'
  }

  public request<T = any>(config: RequestConfig): Promise<T> {
    return this.instance.request(config)
  }

  public get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }

  public patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }
}

export default new Request()
