import { CLIENT_VERSION } from '../constants.js';
import { createWave } from '../models/wave-model.js';
import { getUser, removeUser } from '../models/user-model.js';
import handlerMappings from './handler-mapping.js';
import { getGameAssets } from '../inits/assets.js';

export const handleDisconnect = (socket) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);
  console.log(`Current users`, getUser());
};

export const handleConnection = async (socket, userId) => {
  console.log(`User connected!: ${userId} with socket ID ${socket.id}`);
  console.log('Current users : ', getUser());

  //데이터 데이블 전체 조회
  const assets = getGameAssets();

  //해당 유저의 웨이브 생성
  createWave(userId);

  socket.emit('connection', { userId, assets, highScore, isHighScoreUser });
};

export const handlerEvent = async (io, socket, data) => {
  console.log('Received Data from Client:', data);

  if (!data || !data.clientVersion || !data.handlerId || !data.payload) {
    socket.emit('response', { status: 'fail', message: 'Invalid data structure.' });
    return;
  }

  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit('response', {
      status: 'fail',
      message: 'Client version mismatch',
    });
    return;
  }

  const handler = handlerMappings[data.handlerId];
  if (!handler) {
    socket.emit('response', { status: 'fail', message: 'Handler not found' });
    return;
  }

  try {
    const response = await handler(io, socket, data);

    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response from handler');
    }

    if (response.broadcast) {
      io.emit('response', response);
      return;
    }

    socket.emit('response', response);
  } catch (error) {
    console.error('Error handling event:', error);
    socket.emit('response', { status: 'fail', message: 'Internal server error' });
  }
};
