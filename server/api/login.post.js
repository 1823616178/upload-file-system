import { setCookie } from 'h3';
import { getUserRepository } from '~/server/utils/db';
import { createSession } from '~/server/utils/session';
import crypto from 'crypto';

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;

  if (!username || !password) {
    event.res.statusCode = 400;
    return { message: '请输入用户名和密码' };
  }

  try {
    const userRepository = await getUserRepository()
    const user = await userRepository.findOne({
      where: { username },
    });

    if (!user) {
      event.res.statusCode = 401;
      return { message: '用户名或密码错误' };
    }

    const isValid = await verifyPassword(password, user.password);

    if (isValid) {
      // 登录成功，生成随机 session token
      const sessionToken = createSession(user.username);

      // session-id: 真正用于服务端鉴权，httpOnly 防止被 XSS 读取
      setCookie(event, 'session-id', sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      // auth-token: 不携带任何权限，仅供前端路由中间件判断是否已登录
      setCookie(event, 'auth-token', '1', {
        httpOnly: false,
        path: '/',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return { message: '登录成功' };
    } else {
      event.res.statusCode = 401;
      return { message: '用户名或密码错误' };
    }
  } catch (error) {
    console.error('Login error:', error);
    event.res.statusCode = 500;
    return { message: '服务器内部错误' };
  }
});