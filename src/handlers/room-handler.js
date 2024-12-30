import { createRoom, addUserToRoom, getRoomState, updateGameState } from '../models/room-model.js';

export const handleRoomJoin = async (io, socket, payload) => {
  if (!payload || !payload.userId) {
    console.error('Payload 또는 userId가 누락되었습니다.');
    socket.emit('response', { status: 'fail', message: 'Invalid payload' });
    return;
  }
  const { userId } = payload;
  let roomId;

  // [1] 기존 Room 검색
  const roomKeys = await redisClient.keys('room:*');
  for (const key of roomKeys) {
    const roomData = await getRoomState(key.split(':')[1]);
    if (roomData.players.length < 2) {
      roomId = key.split(':')[1];
      break;
    }
  }

  // [2] 새로운 Room 생성
  if (!roomId) {
    roomId = await createRoom();
  }

  // [3] 사용자 추가 및 소켓 연결
  const players = await addUserToRoom(roomId, userId);
  socket.join(roomId);

  console.log(`User ${userId} joined room ${roomId}`);

  // [4] 클라이언트에 Room 정보 전달
  socket.emit('roomJoined', { roomId, players });

  // [5] 두 명 입장 시 게임 시작 알림
  if (players.length === 2) {
    io.to(roomId).emit('gameStart', { roomId });
    console.log(`Room ${roomId} is ready to start the game.`);
  }
};

export const handleGameStateUpdate = async (io, socket, payload) => {
  const { roomId, gold, score } = payload;

  try {
    // [1] Room 상태 업데이트
    await updateGameState(roomId, { gold, score });

    // [2] 다른 사용자에게 상태 브로드캐스트
    io.to(roomId).emit('stateUpdated', { gold, score });
    console.log(`Room ${roomId} state updated: Gold=${gold}, Score=${score}`);
  } catch (err) {
    console.error(err.message);
    socket.emit('response', { status: 'fail', message: err.message });
  }
};
