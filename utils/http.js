import { toast } from './toast'

// 处理会话失效（401）并跳转到登录页
export const handleUnauthorized = (error) => {
  const status = error?.statusCode || error?.status || error?.response?.status
  if (status === 401 && typeof window !== 'undefined') {
    const authCookie = useCookie('auth-token')
    authCookie.value = null
    toast.warning('登录状态已过期，请重新登录')
    navigateTo('/login')
    return true
  }
  return false
}

// 支持实时上传进度回调的 XHR 上传封装
export const uploadWithProgress = ({ url = '/api/upload', formData, onProgress, signal }) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.withCredentials = true

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100))
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        handleUnauthorized({ status: 401 })
        reject(new Error('未授权，请重新登录'))
        return
      }

      try {
        const data = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data)
        } else {
          resolve({ success: false, error: data.message || data.error || `请求失败 (${xhr.status})` })
        }
      } catch {
        reject(new Error(`服务器返回格式异常 (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('网络连接失败'))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))

    xhr.send(formData)
  })
}

// 将后端 base64 文本载荷解码为 UTF-8 字符串
export const decodeBase64Utf8 = (base64) => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}
