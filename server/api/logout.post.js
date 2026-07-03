import { getCookie, setCookie } from 'h3';
import { destroySession } from '~/server/utils/session';

export default defineEventHandler((event) => {
  const sessionToken = getCookie(event, 'session-id');
  destroySession(sessionToken);

  setCookie(event, 'session-id', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    expires: new Date(0),
  });
  setCookie(event, 'auth-token', '', {
    httpOnly: false,
    path: '/',
    sameSite: 'strict',
    expires: new Date(0),
  });

  return { message: 'Logout successful' };
});
