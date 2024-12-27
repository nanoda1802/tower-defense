import { getGameAssets } from "../inits/assets.js";
import { getHeadquater, setHeadquater } from "../models/headquater.model.js";
import { calculateMonsterMove } from "../utils/calculateMonsterMove.js";
// x1000 y300 베이스 좌표
// 1000을 넘으면 총돌
// 헤드퀸터 충돌 처리
export const collideHandler = (userid, payload) => {
  const { monsters } = getGameAssets();
  //monsterId  = 몬스터 종류
  //monsterIndex = 몬스터 번호
  const { monsterId, monsterIndex, monsterX, timestamp } = payload;

  // 몬스터의 현재 위치 계산
  const currentMonsterX = calculateMonsterMove(monsterId, monsterIndex, timestamp);

  const tolerance = 10; // 허용 오차 범위 설정

  if (Math.abs(monsterX - currentMonsterX) <= tolerance) {
    const monsterAttack = monsters.data.find((monster) => monster.id === monsterId).attack;

    // 최신 HP 가져오기
    const headquater = getHeadquater(userid); // 해당 사용자의 최신 HP 가져오기
    const currentHp = headquater.length > 0 ? headquater[headquater.length - 1].hp : 0; // 최신 HP

    // 플레이어 HP 감소 로직 추가
    const newHp = currentHp - monsterAttack; // 몬스터 공격력만큼 HP 감소

    // 업데이트된 HP를 set으로 저장
    setHeadquater(userid, newHp, Date.now()); // 새로운 HP와 타임스탬프 저장
  } else {
    const difference = monsterX - currentMonsterX; // 차이 계산
    throw new Error(`몬스터의 클라이언트 좌표: ${monsterX}, 서버 좌표: ${currentMonsterX}. 차이: ${difference}`); // 좌표와 차이를 포함한 오류 메시지
  }
};
