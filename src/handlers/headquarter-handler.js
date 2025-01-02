import { getGameAssets } from "../inits/assets.js";
import { rooms } from "../room/room.js";
import { calculateMonsterMove } from "../utils/calculateMonsterMove.js";

/* HQ와 몬스터 충돌 처리 핸들러 */
export const collideHandler = (userId, payload) => {
  // [1] 몬스터 assets 데이터 가져옴
  const { monsters } = getGameAssets();
  // [2] payload 데이터 추출
  const {
    monsterId,
    monsterIndex,
    monsterX,
    monsterY,
    timestamp: collideTime,
  } = payload;
  // [3] 서버에서 해당 유저의 room 가져오기
  const room = rooms.find((room) => {
    return room.userId === userId;
  });
  // [4] 충돌한 몬스터가 생성된 시간 찾기
  const createTime = room
    .getAliveMonsters()
    .find(
      (monster) =>
        monster.monsterId === monsterId &&
        monster.monsterIndex === monsterIndex,
    ).timestamp;
  // [5] 해당 몬스터의 현재 위치 계산
  const severMonsterX = calculateMonsterMove(
    monsterId,
    monsterIndex,
    createTime,
  );
  // [6] 충돌이 유효하다면 충돌 결과 연산
  const tolerance = 500; // 허용 오차 범위 설정
  if (Math.abs(monsterX - severMonsterX) <= tolerance) {
    // [6-1] 몬스터의 공격력 추출
    const monster = monsters.data.find((monster) => monster.id === monsterId);
    const monsterAttack = monster.attack;
    // [6-2] 최신 본부 HP 가져오기
    const headquarter = room.getHq();
    const currentHp = headquarter.length > 0 ? headquarter.at(-1).currentHp : 0;
    // [6-3] 본부 HP 감소 (HP가 0 미만이 되지 않도록 제한)
    const newHp = Math.max(0, currentHp - monsterAttack);
    // [6-4] 업데이트된 HP를 본부에 저장
    room.setHq(newHp, collideTime);
    // [6-5] 충돌한 몬스터 삭제 처리
    room.removeAliveMonsters(monsterId, monsterIndex);
    // [7 A] 성공 응답 반환
    return {
      status: "success",
      message: `본부 체력이 ${monsterAttack}만큼 감소했습니다!!`,
    };
  } else {
    // [7 B] 실패 응답 반환
    const difference = monsterX - severMonsterX;
    return {
      status: "fail",
      message: `당신과 서버의 몬스터의 좌표가 ${difference} 만큼 다릅니다!!`,
    };
  }
};
