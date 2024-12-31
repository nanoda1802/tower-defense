import { v4 as uuidv4 } from 'uuid';
import redisClient from '../inits/redis.js'; // Redis 클라이언트 초기화

export const createRoom = async () => {
  const roomId = uuidv4();
  const roomData = {
    players: [],
    gameState: {
      gold: 0,
      score: 0,
      wave: 0,
    },
  };

  // Redis에 저장
  await redisClient.hSet(`room:${roomId}`, {
    players: JSON.stringify(roomData.players),
    gameState: JSON.stringify(roomData.gameState),
  });

  return roomId;
};

export const addUserToRoom = async (roomId, userId) => {
  const roomData = await redisClient.hGetAll(`room:${roomId}`);
  if (!roomData) throw new Error('Room not found');

  const players = JSON.parse(roomData.players);
  players.push(userId);

  // 업데이트된 데이터 저장
  await redisClient.hSet(`room:${roomId}`, {
    players: JSON.stringify(players),
  });

  return players;
};

export const getRoomState = async (roomId) => {
  const roomData = await redisClient.hGetAll(`room:${roomId}`);
  if (!roomData) throw new Error('Room not found');

  return {
    players: JSON.parse(roomData.players),
    gameState: JSON.parse(roomData.gameState),
  };
};

export const updateGameState = async (roomId, gameState) => {
  await redisClient.hSet(`room:${roomId}`, {
    gameState: JSON.stringify(gameState),
  });
};
