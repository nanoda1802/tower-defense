import { addUser } from '../models/user-model.js';
import {
  handleDisconnect,
  handleEvent,
  handleConnection,
  handleMonster,
  handleTower,
  handleAttack,
} from './helper.js';
import redisClient from '../inits/redis.js';

const registerHandler = (io) => {
  io.on('connection', async (socket) => {
    const userId = socket.user?.userId; // JWT에서 추출된 userId
    const socketId = socket.id;

    // if (userId) {
    //   // Redis에 사용자 정보 저장
    //   await redisClient.hSet('onlineUsers', userId, socketId);
    //   console.log(`User connected: ${userId} with socket ID: ${socketId}`);
    // }

    addUser({ userId, socketId });
    handleConnection(socket, userId);

    // 스코어 보드
    socket.on('getLeaderboard', async (_, callback) => {
      try {
        const leaderboardData = await redisClient.zRangeWithScores('leaderboard', 0, 9, {
          REV: true,
        });

        const leaderboard = leaderboardData.map((entry, index) => ({
          rank: index + 1,
          email: entry.value,
          score: entry.score,
        }));

        callback({ status: 'success', leaderboard });
      } catch (err) {
        console.error(err);
        callback({ status: 'error', message: '스코어 보드를 가져오는 중 오류가 발생했습니다.' });
      }
    });

    // 현재 접속자 목록 요청 처리
    // socket.on('getOnlineUsers', async (callback) => {
    //   try {
    //     const onlineUsers = await redisClient.hGetAll('onlineUsers'); // 모든 접속자 조회
    //     callback({ status: 'success', users: onlineUsers });
    //   } catch (err) {
    //     console.error(err);
    //     callback({ status: 'error', message: '접속자 목록을 가져오는 중 오류가 발생했습니다.' });
    //   }
    // });

    //Event
    socket.on('event', (data) => handleEvent(io, socket, data));

    //Monster
    socket.on('monster', (data) => handleMonster(io, socket, data));

    //Tower
    socket.on('tower', (data) => handleTower(io, socket, data));

    //attack
    socket.on('attack', (data) => handleAttack(io, socket, data));

    //Disconnect
    socket.on('disconnect', async () => {
      // if (userId) {
      //   await redisClient.hDel('onlineUsers', userId); // Redis에서 사용자 제거
      //   console.log(`User disconnected: ${userId}`);
      // }
      handleDisconnect(socket, userId);
    });
  });
};

export default registerHandler;
