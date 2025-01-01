import { v4 as uuidv4 } from 'uuid';
import redisClient from '../inits/redis.js'; // Redis 클라이언트 초기화

// Room 생성
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

// Room 삭제
export const deleteRoom = async (roomId) => {
  const exists = await redisClient.exists(`room:${roomId}`);
  if (!exists) throw new Error(`Room ${roomId} does not exist`);

  await redisClient.del(`room:${roomId}`);
};

// 플레이어 추가
export const addUserToRoom = async (roomId, userId) => {
  const roomData = await redisClient.hGetAll(`room:${roomId}`);
  if (!roomData) throw new Error('Room not found');

  const players = JSON.parse(roomData.players);
  if (players.includes(userId)) throw new Error('User already in room');

  players.push(userId);

  // 업데이트된 데이터 저장
  await redisClient.hSet(`room:${roomId}`, {
    players: JSON.stringify(players),
  });

  return players;
};

// 플레이어 제거
export const removeUserFromRoom = async (roomId, userId) => {
  const roomData = await redisClient.hGetAll(`room:${roomId}`);
  if (!roomData) throw new Error('Room not found');

  const players = JSON.parse(roomData.players);
  const updatedPlayers = players.filter((player) => player !== userId);

  await redisClient.hSet(`room:${roomId}`, {
    players: JSON.stringify(updatedPlayers),
  });

  return updatedPlayers;
};

// Room 상태 조회
export const getRoomState = async (roomId) => {
  const roomData = await redisClient.hGetAll(`room:${roomId}`);
  if (!roomData) throw new Error('Room not found');

  return {
    players: JSON.parse(roomData.players),
    gameState: JSON.parse(roomData.gameState),
  };
};

// Room 상태 업데이트
export const updateGameState = async (roomId, gameState) => {
  await redisClient.hSet(`room:${roomId}`, {
    gameState: JSON.stringify(gameState),
  });
};
