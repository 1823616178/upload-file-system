import { createError, deleteCookie, getCookie, sendRedirect } from 'h3'
import { validateSession } from '../utils/session'
import { authenticateApiRequest, handleOpenApiError } from '../utils/api-auth'

// 无需登录即可访问的 Web 内部 API（登录、登出、健康检查）
// 图片/缩略图接口需要登录：同站 <img> 请求会自动携带 cookie，收紧后不影响页面展示
const PUBLIC_API_PATHS = ['/api/login', '/api/logout', '/api/health']

export default defineEventHandler((event) => {
  const url = event.req.url || ''
  const pathOnly = url.split('?')[0]
  const sessionToken = getCookie(event, 'session-id')
  const session = validateSession(sessionToken)

  // 对外开放接口（/api/v1/*）：采用 API Key 鉴权与限流，返回统一 Open API JSON 错误格式
  if (pathOnly.startsWith('/api/v1/')) {
    try {
      // OpenAPI 文档规范允许已登录后台用户或持有 API Key 的调用方查看
      if (pathOnly === '/api/v1/openapi.json' && session) {
        return
      }
      authenticateApiRequest(event)
      return
    } catch (error) {
      return handleOpenApiError(event, error)
    }
  }

  const isApiRequest = pathOnly.startsWith('/api/')
  if (isApiRequest) {
    if (PUBLIC_API_PATHS.includes(pathOnly)) return
    if (!session) {
      throw createError({ statusCode: 401, message: '未授权，请先登录' })
    }
    return
  }

  // 页面导航鉴权（非 API 请求，例如直接访问受保护页面）
  const acceptHeader = event.req.headers.accept || ''
  const isPageNavigation = acceptHeader.includes('text/html')
  if (isPageNavigation && !session && pathOnly !== '/login') {
    // 清理可能残留的过期前端 cookie（如服务端重启后 auth-token 仍在），避免与前端路由守卫形成重定向死循环
    deleteCookie(event, 'session-id', { path: '/' })
    deleteCookie(event, 'auth-token', { path: '/' })
    return sendRedirect(event, '/login')
  }
})
