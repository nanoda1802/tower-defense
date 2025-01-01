import { CLIENT_VERSION } from '../constants.js';
import { createWave } from '../models/wave-model.js';
import { getUser, removeUser } from '../models/user-model.js';
import {
  eventHandlerMappings,
  monsterHandlerMappings,
  towerHandlerMappings,
  attackHandlerMappings,
} from './handler-mapping.js';
import { getGameAssets } from '../inits/assets.js';
import { createAliveMonsters } from '../models/monster-model.js';
import { createTower, clearRemoveTower } from '../models/tower-model.js';
import { createGold, setGold } from '../models/gold-model.js';
import { createScore } from '../models/score-model.js';
import redisClient from '../inits/redis.js';

/* 연결 해제 관리 */
export const handleDisconnect = async (socket, userId) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);

  // Redis에서 접속 정보 제거
  await redisClient.hDel('onlineUsers', userId);

  console.log(`Current users`, getUser());
};

/* 연결 관리 */
export const handleConnection = async (socket, userId) => {
  console.log(`User connected!: ${userId} with socket ID ${socket.id}`);
  console.log('Current users : ', getUser());

  // Redis에 접속 정보 저장
  await redisClient.hSet('onlineUsers', userId, socket.id);

  createAliveMonsters(userId);
  //데이터 데이블 전체 조회
  const assets = getGameAssets();
  //해당 유저의 웨이브 생성
  createGold(userId);
  createScore(userId);
  createWave(userId);
  createTower(userId);
  clearRemoveTower(userId);

  socket.emit('connection', { userId, assets });
};
/* event 메세지 관리 */
export const handleEvent = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('eventResponse', {
      status: 'fail',
      message: 'Client version mismatch',
    });
    return;
  }

  const handler = eventHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit('eventResponse', {
      status: 'fail',
      message: 'Handler not found',
    });
  }
  const response = await handler(data.userId, data.payload);
  // if (response.broadcast) {
  //   io.emit("response", response);
  //   return;
  // }

  socket.emit('eventResponse', { ...response, handlerId: data.handlerId });
};

/* monster 메세지 관리 */
export const handleMonster = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('monsterResponse', {
      status: 'fail',
      message: 'Client version mismatch',
    });
    return;
  }

  const handler = monsterHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit('monsterResponse', {
      status: 'fail',
      message: 'Handler not found',
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit('monsterResponse', { ...response, handlerId: data.handlerId });
};

/* tower 메세지 관리 */
export const handleTower = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('towerResponse', {
      status: 'fail',
      message: 'Client version mismatch',
    });
    return;
  }

  const handler = towerHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit('towerResponse', {
      status: 'fail',
      message: 'Handler not found',
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit('towerResponse', { ...response, handlerId: data.handlerId });
};

/* attack 메세지 관리 */
export const handleAttack = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('attackResponse', {
      status: 'fail',
      message: 'Client version mismatch',
    });
    return;
  }

  const handler = attackHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit('attackResponse', {
      status: 'fail',
      message: 'Handler not found',
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit('attackResponse', { ...response, handlerId: data.handlerId });
};
