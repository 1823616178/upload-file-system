import { setCookie } from 'h3';

export default defineEventHandler((event) => {
  setCookie(event, 'auth-token', '', {
    httpOnly: false,
    path: '/',
    sameSite: 'strict',
    expires: new Date(0),
  });

  return { message: 'Logout successful' };
});
