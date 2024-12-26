import jwt from 'jsonwebtoken';
import redisClient from '../inits/redis.js';

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key';

export const verifySession = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: Token is missing.'));
  }

  try {
    // JWT 토큰 검증
    const decoded = jwt.verify(token, SECRET_KEY);

    // Redis에서 세션 확인
    const storedToken = await redisClient.get(`session:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return next(new Error('Authentication error: Invalid session.'));
    }

    // 사용자 정보를 소켓 객체에 저장
    socket.userId = decoded.userId;
    socket.email = decoded.email;

    next(); // 인증 성공 시 다음 단계로 진행
  } catch (redisError) {
    console.error('Redis error:', redisError.message);
    console.warn('Fallback to JWT-only authentication');
  }
};
