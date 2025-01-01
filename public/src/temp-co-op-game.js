import { drawMap, placeHQ, spawnMonster } from './game.js';

let coopServerSocket = null; // 협동 모드 전용 WebSocket
let coopSendEvent = null; // 협동 모드 전용 sendEvent 함수
let roomId = null; // 현재 Room ID
let isCoopModeActive = false; // 협동 모드 활성 상태
let sharedGold = 0; // 공유 골드
let sharedScore = 0; // 공유 점수

// 협동 모드 WebSocket 초기화
export const initCoopWebSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('로그인이 필요합니다!');
    window.location.href = 'login.html'; // 로그인 페이지로 리다이렉트
    return;
  }

  // WebSocket 연결
  coopServerSocket = io('http://localhost:3000', {
    auth: { token }, // JWT 토큰 전송
  });

  // WebSocket 연결 성공 시
  coopServerSocket.on('connect', () => {
    console.log('협동 모드 서버와 소켓 연결 성공');
    coopSendEvent = (handlerId, payload) => {
      return new Promise((resolve, reject) => {
        if (!handlerId || !payload) {
          console.error('Invalid event data: handlerId or payload is missing');
          reject(new Error('Invalid event data'));
          return;
        }

        coopServerSocket.emit('event', { clientVersion: '1.0.0', handlerId, payload });

        // 일회성 응답 처리
        coopServerSocket.once('response', (data) => {
          if (data.handlerId === handlerId) {
            resolve(data);
          } else {
            reject(new Error('핸들러 아이디가 일치하지 않습니다!'));
          }
        });
      });
    };
  });

  // WebSocket 연결 실패 시
  coopServerSocket.on('connect_error', (err) => {
    console.error('협동 모드 소켓 연결 실패:', err.message);
    alert('협동 모드 서버와의 연결에 실패했습니다.');
  });
};

// 협동 모드 초기화
export const initCoopMode = () => {
  if (!coopSendEvent) {
    console.error('협동 모드 WebSocket 연결이 완료되지 않았습니다.');
    return;
  }

  if (isCoopModeActive) {
    console.log('이미 협동 모드가 활성화되어 있습니다.');
    return;
  }

  console.log('협동 모드 초기화 중...');

  // 서버에 Room Join 요청
  coopSendEvent(101, {})
    .then((response) => {
      if (response.status === 'success') {
        roomId = response.roomId;
        console.log(`Room joined successfully: ${roomId}`);
        startCoopGame(); // 협동 게임 시작
      } else {
        console.error('Room join failed:', response.message);
      }
    })
    .catch((err) => {
      console.error('Error joining room:', err);
    });
};

// 협동 게임 시작
const startCoopGame = () => {
  isCoopModeActive = true;
  console.log(`협동 게임 시작! Room ID: ${roomId}`);

  // 서버로부터 상태 업데이트 받기
  coopServerSocket.on('stateUpdated', (data) => {
    console.log('Received updated state:', data);
    updateGameState(data); // 상태 업데이트 함수 호출
  });

  initCoopGameLoop(); // 협동 게임 루프 실행
};

// 협동 게임 루프
const initCoopGameLoop = () => {
  const coopGameLoop = () => {
    drawMap(monsterPath); // 맵과 경로 그리기

    towers.forEach((tower) => {
      tower.draw(ctx);
      tower.updateAttackInterval();
      monsters.forEach((monster) => {
        const distance = Math.sqrt(
          Math.pow(tower.x - monster.x, 2) + Math.pow(tower.y - monster.y, 2),
        );
        if (distance < tower.range) {
          tower.attack(monster);
        }
      });
    });

    monsters.forEach((monster) => monster.move());
    HQ.draw(ctx, baseImage);

    updateSharedState(); // 공유 상태 업데이트

    requestAnimationFrame(coopGameLoop); // 프레임 갱신
  };

  coopGameLoop();
};

// 공유 상태 업데이트 서버로 전송
const updateSharedState = () => {
  coopSendEvent(102, { roomId, gold: sharedGold, score: sharedScore }).then((res) => {
    if (res.status === 'success') {
      console.log('Shared state updated successfully!');
    } else {
      console.error('Failed to update shared state:', res.message);
    }
  });
};

// 서버에서 받은 상태를 업데이트
const updateGameState = (data) => {
  const { gold, score } = data;
  sharedGold = gold;
  sharedScore = score;

  console.log(`현재 공유 골드: ${sharedGold}, 점수: ${sharedScore}`);
};
