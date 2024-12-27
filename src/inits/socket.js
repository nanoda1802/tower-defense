import { Server as SocketIO } from 'socket.io';
import registerHandler from '../handlers/register-handler.js';
import jwt from 'jsonwebtoken';

/* Socket.IO 초기화 */
const initSocket = (server) => {
  // [1] 서버에 SocketIO 연결
  const io = new SocketIO(server, {
    cors: {
      origin: 'http://127.0.0.1:8080', // 허용할 클라이언트 URL
      methods: ['GET', 'POST'], // 허용할 HTTP 메서드
      credentials: true, // 인증 정보 포함 여부
    },
  });
  io.attach(server); // [1-2] 서버에 io를 붙여 실시간 통신이 가능하게끔 만듦

  // [1] 소켓 인증 미들웨어 추가
  io.use((socket, next) => {
    console.log('socket : ', socket);
    const token = socket.handshake.auth.token; // 클라이언트에서 보낸 JWT 토큰

    if (!token) {
      console.error('인증 토큰이 없습니다.');
      return next(new Error('Authentication error'));
    }

    console.log('token : ', token);

    try {
      // JWT 토큰 검증 및 디코딩
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
      console.log('Decoded Token:', decoded);

      // userId가 디코딩된 토큰에 포함되어 있는지 확인
      if (!decoded.userId) {
        console.error('JWT에 userId가 없습니다.');
        return next(new Error('Authentication error'));
      }

      // 소켓 객체에 사용자 정보 저장
      socket.user = { userId: decoded.userId };
      next();
    } catch (error) {
      console.error('JWT 검증 실패:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // [2] register 핸들러 실행
  registerHandler(io);
};

export default initSocket;
