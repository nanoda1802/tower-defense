import { getGameAssets } from "../inits/assets.js";

export const calculateMonsterMove = (monsterId, monsterIndex, timestamp) => {
  const { monsters } = getGameAssets();
  let x = 0; // 초기 x 값 설정
  const speed = monsters.data.find((monster) => monster.id === monsterId).speed; // assets파일에서 speed 가져오기
  console.log("서버시간 : 클라시간", Date.now(), timestamp);
  console.log("시간차 ", Date.now() - timestamp);
  x = speed * (Date.now() - timestamp); //현재시간 - 소환시간(ms) * 0.0625(프레임단위로 변환)
  //speed가 2일때, 프레임당 x값 0.125씩 증가
  if (x >= 1200) {
    x = 1200;
  }
  return x;
};
