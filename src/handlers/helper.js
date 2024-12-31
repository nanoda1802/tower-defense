import { CLIENT_VERSION } from '../constants.js';
import { createWave } from '../models/wave-model.js';
import { getUser, removeUser } from '../models/user-model.js';
import { eventHandlerMappings, monsterHandlerMappings } from './handler-mapping.js';
import { getGameAssets } from '../inits/assets.js';
import { createAliveMonsters } from '../models/monster-model.js';
import { createTower, clearRemoveTower } from '../models/tower-model.js';
import { createGold, setGold } from '../models/gold-model.js';
import { createScore } from '../models/score-model.js';

export const handleDisconnect = (socket) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);
  console.log(`Current users`, getUser());
};

export const handleConnection = async (socket, userId) => {
  console.log(`User connected!: ${userId} with socket ID ${socket.id}`);
  console.log('Current users : ', getUser());
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
  // if (response.broadcast) {
  //   io.emit("response", response);
  //   return;
  // }

  socket.emit('monsterResponse', { ...response, handlerId: data.handlerId });
};
