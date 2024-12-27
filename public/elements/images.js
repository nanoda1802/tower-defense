/* 이미지 준비 */
const NUM_OF_MONSTERS = 5;
const NUM_OF_TOWERS = 13;
// [1] 배경
const backgroundImage = new Image();
backgroundImage.src = "images/background.png";
// [2] 검정 병사
const blackTowerImages = [];
for (let i = 1; i <= NUM_OF_TOWERS; i++) {
  const img = new Image();
  img.src = `images/towerB${i}.png`;
  blackTowerImages.push(img);
}
// [3] 빨강 병사
const redTowerImages = [];
for (let i = 1; i <= NUM_OF_TOWERS; i++) {
  const img = new Image();
  img.src = `images/towerR${i}.png`;
  redTowerImages.push(img);
}
// [4] 조커
const jokerImage = new Image();
jokerImage.src = "images/towerJoker.png";
// [5] HQ
const baseImage = new Image();
baseImage.src = "images/hq.png";
// [6] 경로
const pathImage = new Image();
pathImage.src = "images/road.png";
// [7] 몬스터
const monsterImages = [];
for (let i = 1; i <= NUM_OF_MONSTERS; i++) {
  const img = new Image();
  img.src = `images/monster${i}.png`;
  monsterImages.push(img);
}

export {
  backgroundImage,
  blackTowerImages,
  redTowerImages,
  jokerImage,
  baseImage,
  pathImage,
  monsterImages,
};
