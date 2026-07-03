import { getCookie, sendRedirect } from 'h3';
import { validateSession } from '../utils/session';

// 无需登录即可访问的 API（登录、登出、健康检查）
const PUBLIC_API_PATHS = ['/api/login', '/api/logout', '/api/health'];

export default defineEventHandler((event) => {
  const url = event.req.url || '';
  const pathOnly = url.split('?')[0];
  const sessionToken = getCookie(event, 'session-id');
  const session = validateSession(sessionToken);

  const isApiRequest = pathOnly.startsWith('/api/');

  if (isApiRequest) {
    if (PUBLIC_API_PATHS.includes(pathOnly)) return;
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: '未授权，请先登录', message: '未授权，请先登录' });
    }
    return;
  }

  // 页面导航鉴权（非 API 请求，例如直接访问受保护页面）
  const isPageNavigation = event.req.headers.accept && event.req.headers.accept.includes('text/html');
  if (isPageNavigation && !session && pathOnly !== '/login') {
    return sendRedirect(event, '/login');
  }
});
