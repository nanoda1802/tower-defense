/* 이미지 준비 */
const NUM_OF_MONSTERS = 10;
const NUM_OF_PAWNS = 10;
const NUM_OF_SPECIALS = 7;
// [1] 배경
const backgroundImage = new Image();
backgroundImage.src = "images/background.png";
const highlightImage = new Image();
highlightImage.src = "images/highlight.png";
// [2] 검정 병사
const blackPawnImages = [];
for (let i = 0; i < NUM_OF_PAWNS; i++) {
  const img = new Image();
  img.src = `images/pawnB${i}.png`;
  blackPawnImages.push(img);
}
// [3] 빨강 병사
const redPawnImages = [];
for (let i = 0; i < NUM_OF_PAWNS; i++) {
  const img = new Image();
  img.src = `images/pawnR${i}.png`;
  redPawnImages.push(img);
}
// [4] 특수 병사
const specialImages = [];
for (let i = 1; i <= NUM_OF_SPECIALS; i++) {
  const img = new Image();
  img.src = `images/special${i}.png`;
  specialImages.push(img);
}
// [5] HQ
const baseImage = new Image();
baseImage.src = "images/hq.png";
// [6] 경로
const pathImage = new Image();
pathImage.src = "images/road.png";
// [7] 몬스터
const monsterImages = [];
for (let i = 0; i < NUM_OF_MONSTERS; i++) {
  const img = new Image();
  img.src = `images/monster${i}.png`;
  monsterImages.push(img);
}

export {
  backgroundImage,
  highlightImage,
  blackPawnImages,
  redPawnImages,
  specialImages,
  baseImage,
  pathImage,
  monsterImages,
};
