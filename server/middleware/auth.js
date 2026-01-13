import { sendRedirect } from 'h3';

export default defineEventHandler((event) => {
  const authToken = getCookie(event, 'auth-token');
  const url = event.req.url;
  const isPageNavigation = event.req.headers.accept && event.req.headers.accept.includes('text/html');

  if (isPageNavigation && !authToken && url !== '/login') {
    return sendRedirect(event, '/login');
  }
});
