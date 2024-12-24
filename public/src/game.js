import { Base } from "./base.js";
import { Monster } from "./monster.js";
import { Tower } from "./tower.js";

/* 
  어딘가에 엑세스 토큰이 저장이 안되어 있다면 로그인을 유도하는 코드를 여기에 추가해주세요!
*/

let serverSocket; // 서버 웹소켓 객체
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const NUM_OF_MONSTERS = 5; // 몬스터 개수

let userGold = 0; // 유저 골드
let base; // 기지 객체
let baseHp = 0; // 기지 체력

let towerCost = 0; // 타워 구입 비용
let numOfInitialTowers = 0; // 초기 타워 개수
let monsterLevel = 0; // 몬스터 레벨
let monsterSpawnInterval = 3000; // 몬스터 생성 주기
const monsters = [];
const towers = [];

let score = 0; // 게임 점수
let highScore = 0; // 기존 최고 점수
let isInitGame = false;

// 이미지 로딩 파트
const backgroundImage = new Image();
backgroundImage.src = "images/bg.webp";

const towerImage = new Image();
towerImage.src = "images/tower.png";

const baseImage = new Image();
baseImage.src = "images/base.png";

const pathImage = new Image();
pathImage.src = "images/path.png";

const monsterImages = [];
for (let i = 1; i <= NUM_OF_MONSTERS; i++) {
  const img = new Image();
  img.src = `images/monster${i}.png`;
  monsterImages.push(img);
}

let monsterPath;

function generateRandomMonsterPath() {
  const path = [];
  let currentX = 0;
  let currentY = Math.floor(Math.random() * 21) + 500; // 500 ~ 520 범위의 y 시작 (캔버스 y축 중간쯤에서 시작할 수 있도록 유도)

  path.push({ x: currentX, y: currentY });

  while (currentX < canvas.width) {
    currentX += Math.floor(Math.random() * 100) + 50; // 50 ~ 150 범위의 x 증가
    // x 좌표에 대한 clamp 처리
    if (currentX > canvas.width) {
      currentX = canvas.width;
    }

    currentY += Math.floor(Math.random() * 200) - 100; // -100 ~ 100 범위의 y 변경
    // y 좌표에 대한 clamp 처리
    if (currentY < 0) {
      currentY = 0;
    }
    if (currentY > canvas.height) {
      currentY = canvas.height;
    }

    path.push({ x: currentX, y: currentY });
  }

  return path;
}

function generateStraightMonsterPath() {
  const path = [];
  const fixedY = Math.trunc((canvas.height / 3) * 2); // y 값을 캔버스 높이의 절반으로 고정
  const stepX = 100; // x 값 증가 간격
  let currentX = 0;

  while (currentX <= canvas.width) {
    path.push({ x: currentX, y: fixedY });
    currentX += stepX;
  }

  return path;
}

function initMap() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 그리기
  drawPath();
}

function drawPath() {
  const segmentLength = 20; // 몬스터 경로 세그먼트 길이
  const imageWidth = 60; // 몬스터 경로 이미지 너비
  const imageHeight = 60; // 몬스터 경로 이미지 높이
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

function drawRotatedImage(image, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function getRandomPositionNearPath(maxDistance) {
  // 타워 배치를 위한 몬스터가 지나가는 경로 상에서 maxDistance 범위 내에서 랜덤한 위치를 반환하는 함수!
  const segmentIndex = Math.floor(Math.random() * (monsterPath.length - 1));
  const startX = monsterPath[segmentIndex].x;
  const startY = monsterPath[segmentIndex].y;
  const endX = monsterPath[segmentIndex + 1].x;
  const endY = monsterPath[segmentIndex + 1].y;

  const t = Math.random();
  const posX = startX + t * (endX - startX);
  const posY = startY + t * (endY - startY);

  const offsetX = (Math.random() - 0.5) * 2 * maxDistance;
  const offsetY = (Math.random() - 0.5) * 2 * maxDistance;

  return {
    x: posX + offsetX,
    y: posY + offsetY,
  };
}

function placeInitialTowers() {
  /* 
    타워를 초기에 배치하는 함수입니다.
    무언가 빠진 코드가 있는 것 같지 않나요? 
  */
  numOfInitialTowers = 0; // 초기 타워 개수가 빠져있어요 ^_^
  for (let i = 0; i < numOfInitialTowers; i++) {
    const { x, y } = getRandomPositionNearPath(200);
    const tower = new Tower(x, y, towerCost);
    towers.push(tower);
    tower.draw(ctx, towerImage);
  }
}

function placeNewTower() {
  if (pendingTowerPosition) {
    const { x, y } = pendingTowerPosition;
    // 타워 생성
    const tower = new Tower(x, y, towerCost);
    towers.push(tower);
    tower.draw(ctx, towerImage);
    // 생성 후 상태 초기화
    pendingTowerPosition = null;
  } else {
    alert("타워를 배치할 위치를 먼저 선택하세요.");
  }
}

function placeBase() {
  const lastPoint = monsterPath[monsterPath.length - 1];
  base = new Base(lastPoint.x, lastPoint.y, baseHp);
  base.draw(ctx, baseImage);
}

function spawnMonster() {
  monsters.push(new Monster(monsterPath, monsterImages, monsterLevel));
}

function gameLoop() {
  // 렌더링 시에는 항상 배경 이미지부터 그려야 합니다! 그래야 다른 이미지들이 배경 이미지 위에 그려져요!
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // 배경 이미지 다시 그리기
  drawPath(monsterPath); // 경로 다시 그리기

  ctx.font = "25px Times New Roman";
  ctx.fillStyle = "skyblue";
  ctx.fillText(`최고 기록: ${highScore}`, 100, 50); // 최고 기록 표시
  ctx.fillStyle = "white";
  ctx.fillText(`점수: ${score}`, 100, 100); // 현재 스코어 표시
  ctx.fillStyle = "yellow";
  ctx.fillText(`골드: ${userGold}`, 100, 150); // 골드 표시
  ctx.fillStyle = "black";
  ctx.fillText(`현재 레벨: ${monsterLevel}`, 100, 200); // 최고 기록 표시

  // 타워 그리기 및 몬스터 공격 처리
  towers.forEach((tower) => {
    tower.draw(ctx, towerImage);
    tower.updateCooldown();
    monsters.forEach((monster) => {
      const distance = Math.sqrt(
        Math.pow(tower.x - monster.x, 2) + Math.pow(tower.y - monster.y, 2),
      );
      if (distance < tower.range) {
        tower.attack(monster);
      }
    });
  });

  // 몬스터가 공격을 했을 수 있으므로 기지 다시 그리기
  base.draw(ctx, baseImage);

  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    if (monster.hp > 0) {
      const isDestroyed = monster.move(base);
      if (isDestroyed) {
        /* 게임 오버 */
        alert("게임 오버. 스파르타 본부를 지키지 못했다...ㅠㅠ");
        location.reload();
      }
      monster.draw(ctx);
    } else {
      /* 몬스터가 죽었을 때 */
      monsters.splice(i, 1);
    }
  }

  requestAnimationFrame(gameLoop); // 지속적으로 다음 프레임에 gameLoop 함수 호출할 수 있도록 함
}

function initGame() {
  if (isInitGame) {
    return;
  }

  monsterPath = generateStraightMonsterPath(); // 몬스터 경로 생성
  initMap(); // 맵 초기화 (배경, 몬스터 경로 그리기)
  placeInitialTowers(); // 설정된 초기 타워 개수만큼 사전에 타워 배치
  placeBase(); // 기지 배치

  setInterval(spawnMonster, monsterSpawnInterval); // 설정된 몬스터 생성 주기마다 몬스터 생성
  gameLoop(); // 게임 루프 최초 실행
  isInitGame = true;
}

// 이미지 로딩 완료 후 서버와 연결하고 게임 초기화
Promise.all([
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  new Promise((resolve) => (towerImage.onload = resolve)),
  new Promise((resolve) => (baseImage.onload = resolve)),
  new Promise((resolve) => (pathImage.onload = resolve)),
  ...monsterImages.map(
    (img) => new Promise((resolve) => (img.onload = resolve)),
  ),
]).then(() => {
  /* 서버 접속 코드 (여기도 완성해주세요!) */
  let somewhere;
  serverSocket = io("http://localhost:3000", {
    auth: {
      token: somewhere, // 토큰이 저장된 어딘가에서 가져와야 합니다!
    },
  });

  /* 서버에서 "connection" 메세지를 받았을 때  */
  serverSocket.on("connection", (data) => {
    // [1] 서버에서 받은 데이터 출력
    console.log("connection: ", data);
    // [2] 서버에서 받은 정보들 변수에 할당
  });

  /* 서버에서 "response" 메세지를 받았을 때 */
  serverSocket.on("response", (data) => {
    console.log("response : ", data);
  });

  /* 클라이언트에서 서버로 이벤트 보내기 위한 함수 */
  // [1-1] 이벤트에 맞는 담당 핸들러 식별 위해 handlerId 매개변수 받고
  // [1-2] 이벤트에 대한 정보 알려주기 위해 payload 매개변수 받음
  const sendEvent = (handlerId, payload) => {
    return new Promise((resolve, reject) => {
      serverSocket.emit("event", {
        userId,
        handlerId,
        payload,
      });
      // [2] 해당 메세지에 대한 응답 바로 받는 일회성 소켓
      serverSocket.once("response", (data) => {
        if (data.handlerId === handlerId) {
          resolve(data);
        } else {
          reject(new Error("응답이 요상해요?!"));
        }
      });
    });
  };
  /* 
    서버의 이벤트들을 받는 코드들은 여기다가 쭉 작성해주시면 됩니다! 
    e.g. serverSocket.on("...", () => {...});
    이 때, 상태 동기화 이벤트의 경우에 아래의 코드를 마지막에 넣어주세요! 최초의 상태 동기화 이후에 게임을 초기화해야 하기 때문입니다! 
    if (!isInitGame) {
      initGame();
    }
  */
  if (!isInitGame) {
    initGame();
  }
});

const buyTowerButton = document.createElement("button");
buyTowerButton.textContent = "타워 구입";
buyTowerButton.style.position = "absolute";
buyTowerButton.style.top = "10px";
buyTowerButton.style.right = "10px";
buyTowerButton.style.padding = "10px 20px";
buyTowerButton.style.fontSize = "16px";
buyTowerButton.style.cursor = "pointer";
document.body.appendChild(buyTowerButton);

buyTowerButton.addEventListener("click", placeNewTower);

/* 타워 정보 보여주는 div 생성 */
const towerInfoPanel = document.createElement("div");
towerInfoPanel.id = "towerInfoPanel";
towerInfoPanel.style.position = "absolute";
towerInfoPanel.style.right = "10px";
towerInfoPanel.style.top = "60px";
towerInfoPanel.style.padding = "10px";
towerInfoPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
towerInfoPanel.style.color = "white";
towerInfoPanel.style.display = "none"; // 기본적으로 숨김
document.body.appendChild(towerInfoPanel);

/* 클릭 위치에 타워나 경로가 있는지 확인하는 함수 */
function isPositionValid(x, y) {
  const towerRadius = 78; // 타워 이미지 반경
  const pathRadius = 60; // 경로 이미지 반경
  // 다른 타워와의 충돌 확인
  for (const tower of towers) {
    const distance = Math.sqrt(
      Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2),
    );
    if (distance < towerRadius) {
      return false; // 다른 타워와 겹침
    }
  }
  // 경로와의 충돌 확인
  for (const point of monsterPath) {
    const distance = Math.sqrt(
      Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2),
    );
    if (distance < pathRadius) {
      return false; // 경로와 겹침
    }
  }
  return true; // 충돌 없음
}
/* 타워 정보 창 보여주는 함수*/
function showTowerInfo(tower) {
  const towerInfo = document.getElementById("towerInfoPanel");
  towerInfo.style.display = "block";
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
/* 타워 정보 창 숨김 함수 */
function hideTowerInfo() {
  towerInfoPanel.style.display = "none";
}
/* 타워 판매 함수 */
function sellTower(tower) {
  const index = towers.indexOf(tower);
  if (index > -1) {
    userGold += towerCost / 2; // 판매 시 비용의 절반 반환
    towers.splice(index, 1); // 타워 목록에서 제거
    hideTowerInfo(); // 정보 패널 숨김
    console.log("타워 판매됨:", tower);
  }
}
/* 타워 승급 함수 */
function upgradeTower(tower) {
  if (userGold >= towerCost) {
    userGold -= towerCost; // 승급 비용 차감
    tower.attackPower += 10; // 공격력 증가
    tower.range += 20; // 범위 증가
    console.log("타워 승급됨:", tower);
    displayTowerInfo(tower); // 승급 후 갱신된 정보 표시
  } else {
    alert("골드가 부족합니다!");
  }
}

/* 원하는 위치에 타워 생성 */
let selectedTower = null; // 현재 선택된 타워
let pendingTowerPosition = null; // 생성 대기 중인 타워 위치
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  // 타워 클릭 여부 확인
  for (const tower of towers) {
    const distance = Math.sqrt(
      Math.pow(tower.x - x, 2) + Math.pow(tower.y - y, 2),
    );
    if (distance < 30) {
      // 타워 반경 내 클릭
      selectedTower = tower; // 타워 선택
      showTowerInfo(tower); // 선택된 타워 정보 표시
      return;
    }
  }
  // 타워가 없는 빈 공간을 클릭했을 때
  if (isPositionValid(x, y)) {
    hideTowerInfo(); // 타워 이외의 캔버스 클릭 시 선택 해제
    pendingTowerPosition = { x, y }; // 생성 대기 중인 타워 위치 설정
    selectedTower = null; // 선택 초기화
  }
});