import { getGameAssets } from "../inits/assets.js";

// x1000 y300 베이스 좌표
//1000을 넘으면 총돌
// 헤드퀸터 충돌 처리
export const collideHandler = (userid, payload) => {
  const { monsters } = getGameAssets();
  //지금 몬스터 마다 공격력을 가지고 있다.충돌했을떄 hp 감소

  //근데 일단 몬스터 충돌 처리 해야함
  //본부 좌표는 고정되어 있지만 몬스터 좌표는 계속 변경되어 있음
};
