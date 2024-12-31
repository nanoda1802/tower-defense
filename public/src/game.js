import { Base } from './base.js';
import { Monster } from './monster.js';
import { Tower } from './tower.js';
import { Wave } from './wave.js';
import { backgroundImage, blackPawnImages, redPawnImages, specialImages, baseImage, pathImage, monsterImages } from '../elements/images.js';

/* 
  어딘가에 엑세스 토큰이 저장이 안되어 있다면 로그인을 유도하는 코드를 여기에 추가해주세요!
*/

export let serverSocket; // 서버 웹소켓 객체
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let userGold = 0; // 유저 골드
let HQ; // 기지 객체
let initHp = 0; // 기지 체력
let wave = 0;

let monsterSpawnInterval = 200; // 몬스터 생성 주기
let monsters = [];
let towers = [];
let monsterPath;
let isDestroyed = false;

let score = 0; // 게임 점수
let highScore = 0; // 기존 최고 점수
let isInitGame = false;

/* 경로 준비 (배열에 저장) */
function generatePath() {
  const path = [];
  let currentX = 0;
  const stepX = 100; // 경로 한칸 x값 증가량
  const fixedY = Math.trunc((canvas.height / 7) * 4);
  while (currentX <= canvas.width) {
    path.push({ x: currentX, y: fixedY });
    currentX += stepX;
  }
  return path; // 준비된 경로 배열 반환
}
/* 준비된 배경과 경로 캔버스에 그리기 */
export function drawMap(path) {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 그리기
  drawPath(path); // 경로 그리기
}
/* 경로 그리기 (완벽히 이해하지 못함, 다만 지금 직선 경로에선 이 정도 로직은 불필요) */
function drawPath() {
  const segmentLength = 100; // 몬스터 경로 세그먼트 길이
  const imageWidth = 100; // 몬스터 경로 이미지 너비
  const imageHeight = 100; // 몬스터 경로 이미지 높이
  const gap = 5; // 몬스터 경로 이미지 겹침 방지를 위한 간격

  for (let i = 0; i < monsterPath.length - 1; i++) {
    const startX = monsterPath[i].x;
    const startY = monsterPath[i].y;
    const endX = monsterPath[i + 1].x;
    const endY = monsterPath[i + 1].y;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // 피타고라스 정리로 두 점 사이의 거리를 구함 (유클리드 거리)
    const angle = Math.atan2(deltaY, deltaX); // 두 점 사이의 각도는 tan-1(y/x)로 구해야 함 (자세한 것은 역삼각함수 참고): 삼각함수는 변의 비율! 역삼각함수는 각도를 구하는 것!

    for (let j = gap; j < distance - gap; j += segmentLength) {
      // 사실 이거는 삼각함수에 대한 기본적인 이해도가 있으면 충분히 이해하실 수 있습니다.
      // 자세한 것은 https://thirdspacelearning.com/gcse-maths/geometry-and-measure/sin-cos-tan-graphs/ 참고 부탁해요!
      const x = startX + Math.cos(angle) * j; // 다음 이미지 x좌표 계산(각도의 코사인 값은 x축 방향의 단위 벡터 * j를 곱하여 경로를 따라 이동한 x축 좌표를 구함)
      const y = startY + Math.sin(angle) * j; // 다음 이미지 y좌표 계산(각도의 사인 값은 y축 방향의 단위 벡터 * j를 곱하여 경로를 따라 이동한 y축 좌표를 구함)
      drawRotatedImage(pathImage, x, y, imageWidth, imageHeight, angle);
    }
  }
}
/* 경로 이미지 회전시키기 (지금은 직선 경로라 불필요하긴 함) */
function drawRotatedImage(image, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}
/* HQ 설치 */
export function placeHQ() {
  // path의 마지막 지점 좌표 -> 랜덤 경로일 시 마지막 위치에 HQ 오도록 구현하신 듯
  const lastPoint = monsterPath[monsterPath.length - 1];
  HQ = new Base(lastPoint.x, lastPoint.y, initHp);
  HQ.draw(ctx, baseImage);
}
/* 타워 설치 */
function placeNewTower(type, color) {
  // [1] 클릭된 격자의 기준 좌표 가져옴
  if (selectedSpot) {
    const { curX: x, curY: y } = selectedSpot;
    // [2] 서버에 메세지 전송
    sendEvent(41, {
      type,
      color,
      positionX: x,
      positionY: y,
      timestamp: Date.now(),
    }).then((res) => {
      // [3] 검증 성공 시 클라에 적용
      if (res.status === 'success') {
        console.log(res);
        const { positionX: x, positionY: y, type, data } = res;
        const towerNum = data.id;
        // [4] 응답 받은 타워 정보 적용해 설치
        let towerImage;
        if (type === 'pawn' && color === 'black') {
          towerImage = blackPawnImages[0];
        } else if (type === 'pawn' && color === 'red') {
          towerImage = redPawnImages[0];
        } else {
          towerImage = specialImages[towerNum - 2001];
        }
        const tower = new Tower(x, y, towerImage, towerNum, type, data.attack, data.attack_speed, data.range, null, false, null);
        towers.push(tower);
        tower.draw(ctx);
        // [5] 타워 비용만큼 골드 차감
        userGold -= res.cost;
        // [6] 클릭 위치 초기화
        selectedSpot = null;
      } else {
        alert(`설치 실패!! : ${res.message}`);
      }
    });
  } else {
    alert('설치할 위치 먼저 선택하세요!!');
  }
}
function placeInitialTowers(res) {
  const { positionX: x, positionY: y, type, data } = res;
  const towerNum = data.id;
  // [1] 응답 받은 타워 정보 적용해 설치
  let towerImage;
  if (towerNum === 1002) {
    towerImage = blackPawnImages[0];
  } else if (towerNum === 1001) {
    towerImage = redPawnImages[0];
  }
  const tower = new Tower(
    x,
    y,
    towerImage,
    towerNum,
    type,
    data.attack,
    data.attack_speed,
    data.range,
  );
  towers.push(tower);
  tower.draw(ctx);
}

/* 몬스터 생성 */
let monsterIndex = 0;
function spawnMonster(currentWave) {
  let monsterId = waveTable[currentWave - 1].monster_id;
  const killCount = waveTable[currentWave - 1].monster_cnt;
  if (killCount === monsterIndex + 1) {
    monsterId = waveTable[currentWave - 1].boss_id;
  }
  // [1] 서버에 메세지 보냄
  sendMonster(31, {
    timestamp: Date.now(),
    waveId: waveTable[currentWave - 1].id,
    monsterId,
    monsterIndex,
  }).then((res) => {
    if (res.status === 'success') {
      // [2] 몬스터생성
      if (res.isBoss) {
        monsters.push(
          new Monster(
            monsterPath,
            monsterImages[currentWave + 4],
            res.monsterId,
            res.monsterType,
            res.monsterHealth,
            res.monsterAttack,
            res.monsterSpeed,
            res.monsterGold,
            res.monsterScore,
            currentWave,
            res.monsterIndex,
          ),
        );
        wave.isKillBoss = false;
        monsterIndex = 0;
      } else if (!res.isBoss) {
        monsters.push(
          new Monster(
            monsterPath,
            monsterImages[currentWave - 1],
            res.monsterId,
            res.monsterType,
            res.monsterHealth,
            res.monsterAttack,
            res.monsterSpeed,
            res.monsterGold,
            res.monsterScore,
            currentWave,
            monsterIndex,
          ),
        );
        monsterIndex += 1; // [3] 인덱스 증가
      }
    }
  });
}
let prevTime = 0;
/* 게임 루프 */
export async function gameLoop() {
  let now = Date.now();
  let deltaTime = now - prevTime;
  prevTime = now;
  // [1] 배경과 경로, 웨이브 최신화
  drawMap(monsterPath);
  monsterSpawnInterval -= 1;
  if (wave.isKillBoss && monsterSpawnInterval <= 0) {
    spawnMonster(wave.wave);
    monsterSpawnInterval = 200;
  }
  // [3] 타워 그리기와 몬스터 공격 판정 체크
  towers.forEach((tower, towerIndex) => {
    tower.draw(ctx);
    tower.updateAttackInterval();

    if (tower.id === 2001 || tower.id === 2004) {
      if (towers.length > 1 && !tower.buffTarget) {
        sendEvent(45, {
          towerId: tower.id,
          positionX: tower.x,
          positionY: tower.y,
        }).then((res) => {
          let tempTarget = null;
          console.log('res : ', res);
          towers.forEach((targetTower) => {
            //대상 타워 버프 처리
            if (!targetTower.isGetBuff) {
              if (targetTower.x === res.buffTarget.positionX && targetTower.y === res.buffTarget.positionY) {
                targetTower.buffStatus(res.buffValue, res.color, true, res.buffTarget.buffTowerPos);
                tempTarget = targetTower;
              }
            }
          });

          // 현재 버프 타워의 버프 대상 정보 갱신 및 빔 그리기 처리
          tower.updateBuffTowers(res.buffTarget, tempTarget);
        });
      }
    } else {
      // 타워별로 몬스터들과 거리 계산해 범위 안에 오면 공격
      monsters.forEach((monster) => {
        if (monster.currentHp > 0) {
          const distance = Math.sqrt(Math.pow(tower.x - monster.x, 2) + Math.pow(tower.y - monster.y, 2));
          if (distance < tower.range) {
            if (tower.beamDuration <= 0) {
              sendEvent(44, {
                towerType: tower.type,
                towerId: tower.id,
                towerPositionX: tower.x,
                towerPositionY: tower.y,
                monsterType: monster.type,
                monsterId: monster.id,
                monsterPositionX: monster.x,
                monsterPositionY: monster.y,
                timestamp: Date.now(),
                monsterIndex: monster.index,
              }).then((res) => {
                if (res.status === 'success') {
                  tower.attack(monster);
                } else if (res.status === 'fail') {
                  alert(`공격 처리 실패!! ${res.message}`);
                }
              });
            }
          }
        }
      });
    }
  });

  // [4] HQ 피격돼서 잔여 체력 변했을 수 있으니 프레임마다 최신화
  HQ.draw(ctx, baseImage);

  // [5] 몬스터 이동과 게임오버 판정 체크
  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    wave.update(monster.index);
    // [5-1 A] 몬스터가 죽지 않았다면 계속 전진
    if (monster.currentHp > 0) {
      monster.move(deltaTime);
      // [A-1] 몬스터가 HQ에 닿았다면 HQ 체력 감소, 만약 0 이하면 게임 오버 조건 ON
      if (monster.x >= HQ.x && !monster.isEventProcessing) {
        monster.isEventProcessing = true;
        sendEvent(21, {
          monsterId: monster.id,
          monsterIndex: monster.index,
          monsterX: monster.x,
          monsterY: monster.y,
          timestamp: Date.now(),
        }).then((res) => {
          if (res.status === 'success') {
            isDestroyed = monster.collideWith(HQ);
            monsters.splice(i, 1); // 닿은 몬스터 제거
            wave.targetKillCount -= 1;
            wave.update(monster.index);
          } else {
            alert(`충돌 처리 실패!! ${res.message}`);
          }
        });
      }
      // [6] 몬스터 그리기
      monster.draw(ctx);
    } else if (monster.currentHp <= 0 && !monster.isEventProcessing) {
      // [5-1 B] 몬스터가 죽었다면 배열에서 제거
      // [B-1] 서버에 메세지 보냄
      monster.isEventProcessing = true;
      sendMonster(32, {
        timestamp: Date.now(),
        monsterId: monster.id,
        monsterIndex: monster.index,
        monsterHealth: monster.currentHp,
        monsterGold: monster.gold,
        monsterScore: monster.score,
      }).then((res) => {
        if (res.status === 'success') {
          const { monsterGold: goldReward, monsterScore: scoreReward } = res;
          // [B-2] 응답받은 보상 클라에 적용
          userGold += goldReward;
          score += scoreReward;
          // [B-3] 몬스터 제거 및 웨이브 목표 킬 수 차감
          monsters.splice(i, 1);
          wave.targetKillCount -= 1;
          wave.update(monster.index);
        } else {
          alert(`처치 처리 실패!! : ${res.message}`);
        }
      });
    }
  }
  // [7] HQ 체력이 0 이하가 되면 게임 오버, alert 띄우고 새로고침해 index.html로 이동
  if (isDestroyed) {
    sendEvent(12, {
      timestamp: Date.now(),
      score,
      leftGold: userGold,
      status: 'gameOver',
    }).then((res) => {
      alert(`Game Over!! ${res.message}`);
      location.reload(); // 새로고침
      return; // 루프 종료
    });
  }
  if (wave.isClear) {
    sendEvent(12, {
      timestamp: Date.now(),
      score,
      leftGold: userGold,
      status: 'clear',
    }).then((res) => {
      alert(`Game Clear!! ${res.message}`);
      location.reload(); // 새로고침
      return; // 루프 종료
    });
  }
  // [7] (수정 예정) 상태 정보 표시
  ctx.font = '25px Times New Roman';
  ctx.fillStyle = 'skyblue';
  ctx.fillText(`최고 기록: ${highScore}`, 100, 50); // 최고 기록 표시
  ctx.fillStyle = 'white';
  ctx.fillText(`점수: ${score}`, 100, 100); // 현재 스코어 표시
  ctx.fillStyle = 'yellow';
  ctx.fillText(`골드: ${userGold}`, 100, 150); // 골드 표시
  ctx.fillStyle = 'black';
  ctx.fillText(`현재 웨이브: ${wave.wave}`, 100, 200);

  // [8] 프레임 재귀 실행
  requestAnimationFrame(gameLoop);
}
/* 게임 첫 실행 */
async function initGame() {
  if (isInitGame) {
    return; // [1] 이미 실행된 상태면 즉시 탈출
  }
  // [2] 서버에 게임 시작 알림
  await sendEvent(11, { timestamp: Date.now() }).then((res) => {
    // [3] 필요한 요소들 준비 및 초기화
    userGold = res.gold;
    initHp = res.initHp;
    monsters = [];
    towers = [];
    score = 0;
    monsterIndex = 0;
    monsterPath = generatePath(); // 몬스터 경로 준비
    placeHQ(); // 기지 배치
    drawMap(); // 맵 초기화 (배경, 몬스터 경로 그리기)
    wave = new Wave(); // 웨이브 생성
    wave.setWave();
    placeInitialTowers(res); // 초기 타워 설치
    // [4] 게임 실행 상태로 바꾸고 루프 ON
    isInitGame = true;
    gameLoop();
  });
}

/* 이미지 로드 후 서버와 소켓 연결 */
let userId = null;
export let monsterTable = null;
export let waveTable = null;
export let sendEvent = null;
export let sendMonster = null;
// [1] 이미지 로드 작업
Promise.all([
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  new Promise((resolve) => (baseImage.onload = resolve)),
  new Promise((resolve) => (pathImage.onload = resolve)),
  ...blackPawnImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
  ...redPawnImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
  ...specialImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
  ...monsterImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
]).then(() => {
  // [2] 서버와 상호작용 시작
  // [2-1] localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('로그인이 필요합니다!');
    window.location.href = 'login.html'; // 로그인 페이지로 리다이렉트
    return;
  }
  // [2-2] 소켓 생성 후 서버와 handshake
  serverSocket = io('http://localhost:3000', {
    auth: { token }, // JWT 토큰 전송
  });
  // [2-3 A] 소켓 연결 확인 응답
  serverSocket.on('connect', () => {
    console.log('서버와 소켓 연결 성공');
  });

  // 서버로 "event" 메세지 보내기
  sendEvent = (handlerId, payload) => {
    return new Promise((resolve, reject) => {
      serverSocket.emit('event', {
        clientVersion: '1.0.0',
        userId,
        handlerId,
        payload,
      });
      // 해당 메세지에 대한 응답 바로 받는 일회성 이벤트리스너
      serverSocket.once('response', (data) => {
        if (data.handlerId === handlerId) {
          resolve(data);
        } else {
          reject(new Error('핸들러 아이디가 일치하지 않습니더!!'));
        }
      });
    });
  };

  // [2-3 B] 소켓 연결 오류 응답
  serverSocket.on('connect_error', (err) => {
    if (err.message === 'Authentication error') {
      alert('인증에 실패했습니다. 다시 로그인해주세요.');
      localStorage.removeItem('accessToken');
      window.location.href = 'login.html';
    } else {
      console.error('소켓 연결 실패:', err.message);
      alert('서버와의 연결에 실패했습니다.');
    }
  });

  // 서버에서 "connection" 메세지를 받은 후에 게임 시작
  new Promise((resolve) => {
    serverSocket.on('connection', (data) => {
      console.log('connection: ', data);
      userId = data.userId;
      monsterTable = data.assets.monsters.data;
      waveTable = data.assets.waves.data;
      resolve();
    });
  }).then(() => {
    if (!isInitGame) {
      initGame();
    }
  });

  // 서버에서 "eventResponse" 메세지를 받았을 때
  serverSocket.on('eventResponse', (data) => {
    console.log('eventResponse : ', data);
  });

  // 서버로 "event" 메세지 보내기
  sendEvent = (handlerId, payload) => {
    return new Promise((resolve, reject) => {
      serverSocket.emit('event', {
        clientVersion: '1.0.0',
        userId,
        handlerId,
        payload,
      });
      // 해당 메세지에 대한 응답 바로 받는 일회성 이벤트리스너
      serverSocket.once('eventResponse', (data) => {
        if (data.handlerId === handlerId) {
          resolve(data);
        } else {
          reject(new Error('핸들러 아이디가 일치하지 않습니더!!'));
        }
      });
    });
  };

  // 서버로 "monster" 메세지 보내기
  sendMonster = (handlerId, payload) => {
    return new Promise((resolve, reject) => {
      serverSocket.emit('monster', {
        clientVersion: '1.0.0',
        userId,
        handlerId,
        payload,
      });
      // 해당 메세지에 대한 응답 바로 받는 일회성 이벤트리스너
      serverSocket.once('monsterResponse', (data) => {
        if (data.handlerId === handlerId) {
          console.log('monsterResponse', data);
          resolve(data);
        } else {
          reject(new Error('핸들러 아이디가 일치하지 않습니더!!'));
        }
      });
    });
  };
});

/* 구매 및 뽑기를 위한 버튼 생성 */
function createButton(text, top) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.position = 'absolute';
  btn.style.top = `${top}px`;
  btn.style.right = '10px';
  btn.style.padding = '10px 20px';
  btn.style.fontSize = '16px';
  btn.style.cursor = 'pointer';
  return btn;
}
// [1] 검정 병사 구입 버튼
const buyBlackButton = createButton('검정 병사 구입', 10);
document.body.appendChild(buyBlackButton);
buyBlackButton.addEventListener('click', () => {
  placeNewTower('pawn', 'black');
});
// [2] 빨강 병사 구입 버튼
const buyRedButton = createButton('빨강 병사 구입', 50);
document.body.appendChild(buyRedButton);
buyRedButton.addEventListener('click', () => {
  placeNewTower('pawn', 'red');
});
// [3] 특수 병사 뽑기 버튼
const getSpecialButton = createButton('특수 병사 뽑기', 90);
document.body.appendChild(getSpecialButton);
getSpecialButton.addEventListener('click', () => {
  placeNewTower('special');
});

/* 타워 정보 창 생성 */
const towerInfoPanel = document.createElement('div');
towerInfoPanel.id = 'towerInfoPanel';
towerInfoPanel.style.position = 'absolute';
towerInfoPanel.style.right = '10px';
towerInfoPanel.style.top = '120px';
towerInfoPanel.style.padding = '10px';
towerInfoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
towerInfoPanel.style.color = 'white';
towerInfoPanel.style.display = 'none'; // 숨겨놓기
document.body.appendChild(towerInfoPanel);

/* 타워 정보 창 열람 */
function showTowerInfo(tower) {
  const towerInfo = document.getElementById('towerInfoPanel');
  towerInfo.style.display = 'block'; // 보여주기
  towerInfo.innerHTML = `
    <p>타워 위치: (${tower.x}, ${tower.y})</p>
    <p>타워 공격력: ${tower.attackPower}</p>
    <p>타워 공격속도: ${tower.attackSpeed}</p>
    <p>타워 범위: ${tower.range}</p>
    <button id="sellTowerButton">판매</button>
    <button id="upgradeTowerButton">승급</button>
  `;
  // 판매 버튼 누르면 판매
  document.getElementById('sellTowerButton').addEventListener('click', () => {
    sellTower(tower);
    towerInfo.style.display = 'none';
  });
  // 승급 버튼 누르면 승급
  document.getElementById('upgradeTowerButton').addEventListener('click', () => {
    upgradeTower(tower);
  });
}

/* 타워 정보 창 숨기기 */
function hideTowerInfo() {
  towerInfoPanel.style.display = 'none';
}

/* 타워 판매 */
function sellTower(tower) {
  // [1] 서버에 메세지 보냄
  console.log('####삭제');
  console.log(tower);
  sendEvent(42, {
    type: tower.type,
    towerId: tower.id,
    positionX: tower.x,
    positionY: tower.y,
    timestamp: Date.now(),
  }).then((res) => {
    if (res.status === 'success') {
      // 버프 타워 삭제인 경우
      if ((tower.id === 2001 || tower.id === 2004) && tower.buffTarget) {
        towers.forEach((targetTower) => {
          if (targetTower.id === tower.buffTarget.data.id && targetTower.x === tower.buffTarget.positionX && targetTower.y === tower.buffTarget.positionY) {
            targetTower.buffStatus(res.buffValue, tower.id === 2001 ? 'red' : 'black', false);
          }
        });
      } else if (tower.isGetBuff) {
        console.log('### 버프 받은 타워 삭제');
        const buffTowerPosition = tower.buffTowerPos.split(',');
        console.log('buffTowerPosition : ', buffTowerPosition[0], buffTowerPosition[1]);
        towers.forEach((targetTower) => {
          if (targetTower.x === Number(buffTowerPosition[0]) && targetTower.y === Number(buffTowerPosition[1])) {
            targetTower.updateBuffTowers(null, null);
            console.log(targetTower);
          }
        });
      }

      const index = towers.indexOf(tower);
      if (index > -1) {
        userGold += res.price; // [2] 응답받은 가격만큼 골드 획득
        towers.splice(index, 1); // [3] 타워 목록에서 제거
      }
    } else {
      alert(`판매 실패!! : ${res.message}`);
    }
    hideTowerInfo(); // [4] 정보 패널 다시 숨김
  });
}

/* 타워 승급 */
function upgradeTower(tower) {
  const currentImageNum = tower.image.src.at(-5);
  if (currentImageNum === '9') {
    alert('이미 최대로 승급된 병사입니다!!');
    return;
  }
  // [1] 서버에 메세지 보냄
  sendEvent(43, {
    type: tower.type,
    towerId: tower.id,
    positionX: tower.x,
    positionY: tower.y,
    timestamp: Date.now(),
  }).then((res) => {
    if (res.status === 'success') {
      const { cost, data, type } = res;
      if (userGold >= cost) {
        userGold -= cost; // [2] 승급 비용 차감
        // [3] 타워 스탯 증가 (서버가 준 값으로 변경)
        tower.attackPower = data.attack;
        tower.attackSpeed = data.attack_speed;
        tower.range = data.range;
        // [4] 타워 이미지 변경
        if (type === "pawn" && data.color === "black") {
          tower.image = blackPawnImages[+currentImageNum + 1];
        } else if (type === 'pawn' && data.color === 'red') {
          tower.image = redPawnImages[+currentImageNum + 1];
        }
        showTowerInfo(tower); // [5] 승급 후 갱신된 정보 표시
      }
    } else {
      alert(`승급 실패!! : ${res.message}`);
    }
  });
}

/* 클릭 위치에 타워나 경로가 있는지 확인하는 함수 */
function isPositionValid(x, y) {
  const curX = Math.floor(x / 100) * 100;
  const curY = Math.floor(y / 100) * 100;
  const towerRadius = 20; // 주변 타워 탐색 반경
  const pathRadius = 20; // 주변 경로 탐색 반경
  // [1] 다른 타워와의 충돌 확인
  for (const tower of towers) {
    const distance = Math.sqrt(Math.pow(tower.x - curX, 2) + Math.pow(tower.y - curY, 2));
    if (distance < towerRadius) {
      return false; // 다른 타워와 겹침
    }
  }
  // [2] 경로와의 충돌 확인
  for (const point of monsterPath) {
    const distance = Math.sqrt(Math.pow(point.x - curX, 2) + Math.pow(point.y - curY, 2));
    if (distance < pathRadius) {
      return false; // 경로와 겹침
    }
  }
  return true; // 충돌 없음
}

/* 화면 클릭 상호작용 - 타워 설치 및 선택 등등 */
let selectedTower = null; // 현재 선택된 타워
let selectedSpot = null; // 현재 선택된 위치
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  // [1] 클릭 위치 캔버스 내 좌표로 조정
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // [2] 10의 자리 이하 날려서 고정 위치로 변환
  const curX = Math.floor(x / 100) * 100;
  const curY = Math.floor(y / 100) * 100;
  // [3] 선택된 위치에 타워가 있는지 판단
  for (const tower of towers) {
    const distance = Math.sqrt(Math.pow(tower.x - curX, 2) + Math.pow(tower.y - curY, 2));
    if (distance < 30) {
      selectedTower = tower;
      showTowerInfo(tower); // 선택된 타워 정보 표시
      return;
    }
  }
  // [4] 빈 공간을 클릭했는지 판단
  if (isPositionValid(x, y)) {
    hideTowerInfo(); // 타워 상태 창 숨기기
    selectedSpot = { curX, curY };
    selectedTower = null; // 타워 선택 초기화
  }
});

export { towers, monsters, HQ, baseImage };
