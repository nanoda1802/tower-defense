import { Base } from "./base.js";
import { Monster } from "./monster.js";
import { Tower } from "./tower.js";
import { Wave } from "./wave.js";
import {
  backgroundImage,
  blackTowerImages,
  redTowerImages,
  jokerImage,
  baseImage,
  pathImage,
  monsterImages,
} from "../elements/images.js";

/* 
  어딘가에 엑세스 토큰이 저장이 안되어 있다면 로그인을 유도하는 코드를 여기에 추가해주세요!
*/

export let serverSocket; // 서버 웹소켓 객체
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let userGold = 0; // 유저 골드
let HQ; // 기지 객체
let baseHp = 0; // 기지 체력
let wave = 0;

let towerCost = 0; // 타워 구입 비용
let monsterSpawnInterval = 1500; // 몬스터 생성 주기
const monsters = [];
const towers = [];
let monsterPath;

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
function drawMap(path) {
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
function placeHQ() {
  // path의 마지막 지점 좌표 -> 랜덤 경로일 시 마지막 위치에 HQ 오도록 구현하신 듯
  const lastPoint = monsterPath[monsterPath.length - 1];
  HQ = new Base(lastPoint.x, lastPoint.y, baseHp);
  HQ.draw(ctx, baseImage);
}
/* 타워 설치 */
function placeNewTower(type, color) {
  if (selectedSpot) {
    const { curX: x, curY: y } = selectedSpot;
    sendEvent(41, {
      type,
      color,
      positionX: x,
      positionY: y,
      timestamp: Date.now(),
    }).then((res) => {
      const { positionX: x, positionY: y, type, data } = res;
      const towerNum = data.id;
      // 타워 생성
      let towerImage;
      if (color === "black") {
        towerImage = blackTowerImages[towerNum - 1001];
      } else if (color === "red") {
        towerImage = redTowerImages[towerNum - 1000];
      } else {
        towerImage = jokerImage;
      }
      towerCost = type === "pawn" ? 10 : 30;
      const tower = new Tower(x, y, towerCost, towerImage, towerNum, type);
      towers.push(tower);
      tower.draw(ctx);
      // 생성 후 상태 초기화
      selectedSpot = null;
    });
  } else {
    alert("타워를 배치할 위치를 먼저 선택하세요.");
  }
}
/* 몬스터 생성 */
let monsterIndex = 0;
function spawnMonster() {
  let currentWave = wave.wave;
  sendEvent(31, {
    timestamp: Date.now(),
    waveId: waveTable[currentWave - 1].id,
    monsterId: waveTable[currentWave - 1].monster_id,
    monsterIndex,
  }).then((res) => {
    if (res.status === "success") {
      monsters.push(
        new Monster(
          monsterPath,
          monsterImages[currentWave - 1],
          res.monsterHealth,
          res.monsterAttack,
          res.monsterSpeed,
          res.monsterGold,
          res.monsterScore,
          currentWave,
        ),
      );
      monsterIndex += 1;
      console.log("저쪽 신사분이 주문하신 인덱스입니다", monsterIndex);
    }
    if (monsterIndex === waveTable[currentWave - 1].monster_cnt) {
      monsterIndex = 0;
    }
  });
}
/* 게임 루프 */
async function gameLoop() {
  // [1] 배경과 경로, 웨이브 최신화
  drawMap(monsterPath);
  wave.update();
  // [3] 타워 그리기와 몬스터 공격 판정 체크
  towers.forEach((tower) => {
    tower.draw(ctx);
    tower.updateAttackInterval();
    // 타워별로 몬스터들과 거리 계산해 범위 안에 오면 공격
    monsters.forEach((monster) => {
      const distance = Math.sqrt(
        Math.pow(tower.x - monster.x, 2) + Math.pow(tower.y - monster.y, 2),
      );
      if (distance < tower.range) {
        const { gold: goldReward, score: scoreReward } = tower.attack(monster);
        userGold += goldReward;
        score += scoreReward;
      }
    });
  });

  // [4] HQ 피격돼서 잔여 체력 변했을 수 있으니 프레임마다 최신화
  HQ.draw(ctx, baseImage);

  // [5] 몬스터 이동과 게임오버 판정 체크
  let isDestroyed;
  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    // [5-1 A] 몬스터가 죽지 않았다면 계속 전진
    if (monster.currentHp > 0) {
      monster.move();
      // [5-2 A] 몬스터가 HQ에 닿았다면 HQ 체력 감소, 만약 0 이하면 게임 오버 조건 ON
      if (monster.x >= HQ.x) {
        // sendEvent()
        isDestroyed = monster.collideWith(HQ);
        monsters.splice(i, 1); // 닿은 몬스터 제거
        wave.targetKillCount -= 1;
      }
      // [5-3 A] HQ 체력이 0 이하가 되면 게임 오버, alert 띄우고 새로고침해 index.html로 이동
      if (isDestroyed) {
        // sendEvent(12, {});
        alert("Game Over!!");
        location.reload(); // 새로고침
        return; // 루프 종료
      }
      // [6] 몬스터 그리기
      monster.draw(ctx);
    } else {
      // [5-1 B] 몬스터가 죽었다면 배열에서 제거
      // sendEvent()
      monsters.splice(i, 1);
      wave.targetKillCount -= 1;
    }
  }
  // [7] (수정 예정) 상태 정보 표시
  ctx.font = "25px Times New Roman";
  ctx.fillStyle = "skyblue";
  ctx.fillText(`최고 기록: ${highScore}`, 100, 50); // 최고 기록 표시
  ctx.fillStyle = "white";
  ctx.fillText(`점수: ${score}`, 100, 100); // 현재 스코어 표시
  ctx.fillStyle = "yellow";
  ctx.fillText(`골드: ${userGold}`, 100, 150); // 골드 표시
  ctx.fillStyle = "black";
  ctx.fillText(`현재 웨이브: ${wave.wave}`, 100, 200);

  // [8] 프레임 재귀 실행
  requestAnimationFrame(gameLoop);
}

/* 게임 첫 실행 */
function initGame() {
  if (isInitGame) {
    return; // [1] 이미 실행된 상태면 즉시 탈출
  }
  // [2] 필요한 요소들 준비
  monsterPath = generatePath(); // 몬스터 경로 준비
  drawMap(); // 맵 초기화 (배경, 몬스터 경로 그리기)
  placeHQ(); // 기지 배치
  wave = new Wave(); // 웨이브 생성
  wave.setWave();
  // // [3] 생성 주기에 맞게 몬스터 생성 시작
  setInterval(spawnMonster, monsterSpawnInterval);
  // [4] 게임 실행 상태로 바꾸고 루프 ON
  isInitGame = true;
  gameLoop();
  // [5] 서버에 게임 시작 알림
  sendEvent(11, { timestamp: Date.now() });
}
/* 이미지 로드 후 서버와 소켓 연결 */
let userId = null;
export let monsterTable = null;
export let waveTable = null;
export let sendEvent = null;
// [1] 이미지 로드 작업
Promise.all([
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  new Promise((resolve) => (baseImage.onload = resolve)),
  new Promise((resolve) => (pathImage.onload = resolve)),
  new Promise((resolve) => (jokerImage.onload = resolve)),
  ...blackTowerImages.map(
    (img) => new Promise((resolve) => (img.onload = resolve)),
  ),
  ...redTowerImages.map(
    (img) => new Promise((resolve) => (img.onload = resolve)),
  ),
  ...monsterImages.map(
    (img) => new Promise((resolve) => (img.onload = resolve)),
  ),
]).then(() => {
  // [2] 서버와 상호작용 시작
  // [2-1] localStorage에서 JWT 토큰 가져오기
  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인이 필요합니다!");
    window.location.href = "login.html"; // 로그인 페이지로 리다이렉트
    return;
  }
  // [2-2] 소켓 생성 후 서버와 handshake
  serverSocket = io("http://localhost:3000", {
    auth: { token }, // JWT 토큰 전송
  });
  // [2-3 A] 소켓 연결 확인 응답
  serverSocket.on("connect", () => {
    console.log("서버와 소켓 연결 성공");
  });
  // [2-3 B] 소켓 연결 오류 응답
  serverSocket.on("connect_error", (err) => {
    if (err.message === "Authentication error") {
      alert("인증에 실패했습니다. 다시 로그인해주세요.");
      localStorage.removeItem("accessToken");
      window.location.href = "login.html";
    } else {
      console.error("소켓 연결 실패:", err.message);
      alert("서버와의 연결에 실패했습니다.");
    }
  });

  // 서버에서 "connection" 메세지를 받은 후에 게임 시작
  new Promise((resolve) => {
    serverSocket.on("connection", (data) => {
      console.log("connection: ", data);
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

  // 서버에서 "response" 메세지를 받았을 때
  serverSocket.on("response", (data) => {
    console.log("response : ", data);
  });

  // 서버로 "event" 메세지 보내기
  sendEvent = (handlerId, payload) => {
    return new Promise((resolve, reject) => {
      serverSocket.emit("event", {
        clientVersion: "1.0.0",
        userId,
        handlerId,
        payload,
      });
      // 해당 메세지에 대한 응답 바로 받는 일회성 이벤트리스너
      serverSocket.once("response", (data) => {
        if (data.handlerId === handlerId) {
          resolve(data);
        } else {
          reject(new Error("핸들러 아이디가 일치하지 않습니더!!"));
        }
      });
    });
  };
});

/* 구매 및 뽑기를 위한 버튼 생성 */
function createButton(text, top) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.style.position = "absolute";
  btn.style.top = `${top}px`;
  btn.style.right = "10px";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "16px";
  btn.style.cursor = "pointer";
  return btn;
}
// [1] 검정 병사 구입 버튼
const buyBlackButton = createButton("검정 병사 구입", 10);
document.body.appendChild(buyBlackButton);
buyBlackButton.addEventListener("click", () => {
  placeNewTower("pawn", "black");
});
// [2] 빨강 병사 구입 버튼
const buyRedButton = createButton("빨강 병사 구입", 50);
document.body.appendChild(buyRedButton);
buyRedButton.addEventListener("click", () => {
  placeNewTower("pawn", "red");
});
// [3] 특수 병사 뽑기 버튼
const getSpecialButton = createButton("특수 병사 뽑기", 90);
document.body.appendChild(getSpecialButton);
getSpecialButton.addEventListener("click", () => {
  // sendEvent로 가챠 진행 후 그 응답을 placeNewTower의 매개변수로 투입
  placeNewTower("special", "none");
});

/* 타워 정보 창 생성 */
const towerInfoPanel = document.createElement("div");
towerInfoPanel.id = "towerInfoPanel";
towerInfoPanel.style.position = "absolute";
towerInfoPanel.style.right = "10px";
towerInfoPanel.style.top = "120px";
towerInfoPanel.style.padding = "10px";
towerInfoPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
towerInfoPanel.style.color = "white";
towerInfoPanel.style.display = "none"; // 숨겨놓기
document.body.appendChild(towerInfoPanel);

/* 타워 정보 창 열람 */
function showTowerInfo(tower) {
  const towerInfo = document.getElementById("towerInfoPanel");
  towerInfo.style.display = "block"; // 보여주기
  towerInfo.innerHTML = `
    <p>타워 위치: (${tower.x}, ${tower.y})</p>
    <p>타워 공격력: ${tower.attackPower}</p>
    <p>타워 범위: ${tower.range}</p>
    <button id="sellTowerButton">판매</button>
    <button id="upgradeTowerButton">승급</button>
  `;
  // 판매 버튼 누르면 판매
  document.getElementById("sellTowerButton").addEventListener("click", () => {
    sellTower(tower);
    towerInfo.style.display = "none";
  });
  // 승급 버튼 누르면 승급
  document
    .getElementById("upgradeTowerButton")
    .addEventListener("click", () => {
      upgradeTower(tower);
    });
}

/* 타워 정보 창 숨기기 */
function hideTowerInfo() {
  towerInfoPanel.style.display = "none";
}

/* 타워 판매 (검증 실패 시 처리도 해야 함 alert 띄우기) */
function sellTower(tower) {
  sendEvent(42, {
    type: tower.type,
    towerId: tower.id,
    positionX: tower.x,
    positionY: tower.y,
    timestamp: Date.now(),
  }).then((res) => {
    const index = towers.indexOf(tower);
    if (index > -1) {
      userGold += res.price; // [1] 가격만큼 골드 획득
      towers.splice(index, 1); // [2] 타워 목록에서 제거
      hideTowerInfo(); // [3] 정보 패널 다시 숨김
      console.log("얼마 얻었는지 리터럴로 알려주기 res.price로");
    }
  });
}

/* 타워 승급 (검증 실패 시 처리도 해야 함) */
function upgradeTower(tower) {
  sendEvent(43, {
    type: tower.type,
    towerId: tower.id,
    positionX: tower.x,
    positionY: tower.y,
    timestamp: Date.now(),
  }).then((res) => {
    if (userGold >= res.cost) {
      userGold -= res.cost; // [1] 승급 비용 차감
      tower.attackPower += 10; // [2] 공격력 증가 (서버가 준 값으로 변경)
      tower.range += 20; // [3] 범위 증가 (서버가 준 값으로 변경)
      console.log("얼마 들었는지, 얼마나 강해졌는지 템플릿 리터럴로 보여주기");
      showTowerInfo(tower); // 승급 후 갱신된 정보 표시
    } else {
      alert("골드가 부족합니다!");
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
    const distance = Math.sqrt(
      Math.pow(tower.x - curX, 2) + Math.pow(tower.y - curY, 2),
    );
    if (distance < towerRadius) {
      return false; // 다른 타워와 겹침
    }
  }
  // [2] 경로와의 충돌 확인
  for (const point of monsterPath) {
    const distance = Math.sqrt(
      Math.pow(point.x - curX, 2) + Math.pow(point.y - curY, 2),
    );
    if (distance < pathRadius) {
      return false; // 경로와 겹침
    }
  }
  return true; // 충돌 없음
}

/* 화면 클릭 상호작용 - 타워 설치 및 선택 등등 */
let selectedTower = null; // 현재 선택된 타워
let selectedSpot = null; // 현재 선택된 위치
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  // [1] 클릭 위치 캔버스 내 좌표로 조정
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // [2] 10의 자리 이하 날려서 고정 위치로 변환
  const curX = Math.floor(x / 100) * 100;
  const curY = Math.floor(y / 100) * 100;
  // [3] 선택된 위치에 타워가 있는지 판단
  for (const tower of towers) {
    const distance = Math.sqrt(
      Math.pow(tower.x - curX, 2) + Math.pow(tower.y - curY, 2),
    );
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
