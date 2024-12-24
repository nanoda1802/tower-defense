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
let monsterSpawnInterval = 0; // 몬스터 생성 주기
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

/* 몬스터 종류별로 이미지 준비해주는 반복문 */
const monsterImages = [];
for (let i = 1; i <= NUM_OF_MONSTERS; i++) {
  const img = new Image();
  img.src = `images/monster${i}.png`;
  monsterImages.push(img);
}

let monsterPath;

function generateFixedMonsterPath() {
  const path = [];
  const startX = 0;
  const endX = 500;
  const fixedY = 250; // 경로의 y좌표를 50만큼 올려서 250으로 설정

  for (let x = startX; x <= endX; x += 50) {
    path.push({ x: x, y: fixedY });
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
      const x = startX + Math.cos(angle) * j;
      const y = startY + Math.sin(angle) * j;
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
  for (let i = 0; i < numOfInitialTowers; i++) {
    const { x, y } = getRandomPositionNearPath(200);
    const tower = new Tower(x, y, towerCost);
    towers.push(tower);
    tower.draw(ctx, towerImage);
  }
}

function placeNewTower() {
  const { x, y } = getRandomPositionNearPath(200);
  const tower = new Tower(x, y);
  towers.push(tower);
  tower.draw(ctx, towerImage);
}

function placeBase() {
  const lastPoint = monsterPath[monsterPath.length - 1];
  base = new Base(lastPoint.x + 80, lastPoint.y + 20, baseHp); // 경로의 끝에 기지를 배치
  base.draw(ctx, baseImage);
}

function spawnMonster() {
  monsters.push(new Monster(monsterPath, monsterImages, monsterLevel, 80)); // 몬스터의 y 좌표를 80 올림
}

function gameLoop() {
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

  towers.forEach((tower) => {
    tower.draw(ctx, towerImage);
    tower.updateCooldown();
    monsters.forEach((monster) => {
      const distance = Math.sqrt(Math.pow(tower.x - monster.x, 2) + Math.pow(tower.y - monster.y, 2));
      if (distance < tower.range) {
        tower.attack(monster);
      }
    });
  });

  base.draw(ctx, baseImage);

  for (let i = monsters.length - 1; i >= 0; i--) {
    const monster = monsters[i];
    if (monster.hp > 0) {
      const isDestroyed = monster.move(base);
      if (isDestroyed) {
        alert("게임 오버. 스파르타 본부를 지키지 못했다...ㅠㅠ");
        location.reload();
      }
      monster.draw(ctx);
    } else {
      monsters.splice(i, 1);
    }
  }

  requestAnimationFrame(gameLoop);
}

function initGame() {
  if (isInitGame) {
    requestAnimationFrame(gameLoop);
    return;
  }

  monsterPath = generateFixedMonsterPath(); // 몬스터 경로 생성
  initMap(); // 맵 초기화 (배경, 몬스터 경로 그리기)
  placeInitialTowers(); // 설정된 초기 타워 개수만큼 사전에 타워 배치
  placeBase(); // 기지 배치

  setInterval(spawnMonster, monsterSpawnInterval); // 설정된 몬스터 생성 주기마다 몬스터 생성
  gameLoop(); // 게임 루프 최초 실행
  isInitGame = true;
}

Promise.all([
  new Promise((resolve) => (backgroundImage.onload = resolve)),
  new Promise((resolve) => (towerImage.onload = resolve)),
  new Promise((resolve) => (baseImage.onload = resolve)),
  new Promise((resolve) => (pathImage.onload = resolve)),
  ...monsterImages.map((img) => new Promise((resolve) => (img.onload = resolve))),
]).then(() => {
  let somewhere;
  serverSocket = io("서버주소", {
    auth: {
      token: somewhere,
    },
  });

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

buyTowerButton.addEventListener("click", placeNewTower);

document.body.appendChild(buyTowerButton);

initGame();
