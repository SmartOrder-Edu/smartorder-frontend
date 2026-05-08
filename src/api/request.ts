import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

export interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean
}

class Request {
  private instance: AxiosInstance
  private baseURL: string

  constructor(config: AxiosRequestConfig = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || '/api'
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
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
        if (data.code !== 200 && data.code !== 0) {
          ElMessage.error(data.message || '请求失败')
          return Promise.reject(new Error(data.message || '请求失败'))
        }
        return data.data
      },
      (error) => {
        const { response } = error
        if (response) {
          switch (response.status) {
            case 401:
              ElMessage.error('未授权，请重新登录')
              localStorage.removeItem('token')
              window.location.href = '/login'
              break
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
              ElMessage.error(response.data?.message || '请求失败')
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
