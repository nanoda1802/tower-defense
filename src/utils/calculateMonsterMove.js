import { getGameAssets } from "../inits/assets.js";

export const calculateMonsterMove = (monsterId, monsterIndex, timestamp) => {
  const { monsters } = getGameAssets();
  let x = 0; // 초기 x 값 설정
  const speed = monsters.data.find((monster) => monster.id === monsterId).speed; // assets파일에서 speed 가져오기
  x = speed * (Date.now() - timestamp); //현재시간 - 소환시간(ms)
  if (x >= 1200) {
    x = 1200;
  }
  return x;
};
