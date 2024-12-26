import { Server as SocketIO } from 'socket.io';
import { handlerEvent } from '../handlers/helper.js'; // 모든 이벤트 처리 함수
import { verifySession } from '../middlewares/auth-mw.js'; // 인증 미들웨어

/* Socket.IO 초기화 */
const initSocket = (server) => {
  const io = new SocketIO(server, {
    cors: {
      origin: ['http://localhost:8080', 'http://127.0.0.1:8080'], // 여러 출처 허용
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('event', async (data) => {
      try {
        if (data.handlerId === 61 || data.handlerId === 62) {
          // 회원가입 및 로그인 요청은 인증 없이 처리
          console.log('Processing without authentication...');
          await handlerEvent(io, socket, data);
        } else {
          // 다른 요청은 인증 미들웨어 실행
          verifySession(socket, async (err) => {
            if (err) {
              console.error('Authentication failed:', err.message);
              socket.emit('response', { status: 'fail', message: 'Authentication failed.' });
              return;
            }

            console.log(`Authenticated user: ${socket.email}`);
            await handlerEvent(io, socket, data); // 인증 성공 시 이벤트 처리
          });
        }
      } catch (error) {
        console.error('Error handling event:', error.message);
        socket.emit('response', { status: 'fail', message: 'Internal server error.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default initSocket;
