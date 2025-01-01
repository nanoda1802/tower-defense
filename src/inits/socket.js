import { Server as SocketIO } from 'socket.io';
import registerHandler from '../handlers/register-handler.js';
import jwt from 'jsonwebtoken';
import redisClient from '../inits/redis.js'; // Redis 클라이언트

/* Socket.IO 초기화 */
const initSocket = (server) => {
  // [1] 서버에 SocketIO 연결
  const io = new SocketIO(server, {
    cors: {
      origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://wakelight.shop:3000',
        'http://localhost:3000',
      ], // 허용할 클라이언트 URL
      methods: ['GET', 'POST', 'DELETE'], // 허용할 HTTP 메서드
      credentials: true, // 인증 정보 포함 여부
    },
  });
  io.attach(server); // [1-2] 서버에 io를 붙여 실시간 통신이 가능하게끔 만듦

  // [2] 소켓 인증 미들웨어 추가
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token; // 클라이언트에서 보낸 JWT 토큰

    if (!token) {
      console.error('인증 토큰이 없습니다.');
      return next(new Error('Authentication error'));
    }

    try {
      // [2-1] JWT 토큰 검증 및 디코딩
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
      console.log('Decoded Token:', decoded);

      if (!decoded.userId || !decoded.email) {
        console.error('JWT에 userId 또는 email이 없습니다.');
        return next(new Error('Authentication error'));
      }

      // [2-2] Redis에서 세션 확인
      const sessionKey = `session:${decoded.email}`;
      const sessionData = await redisClient.hGetAll(sessionKey);

      if (!sessionData || sessionData.token !== token) {
        console.error('유효하지 않은 세션입니다.');
        return next(new Error('Invalid session'));
      }

      // [2-3] 소켓 객체에 사용자 정보 저장
      socket.user = { userId: decoded.userId, email: decoded.email };
      next();
    } catch (error) {
      console.error('JWT 검증 실패:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // [3] WebSocket 핸들러 등록
  registerHandler(io);
};

export default initSocket;
