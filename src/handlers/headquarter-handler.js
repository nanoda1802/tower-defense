import { getGameAssets } from '../inits/assets.js';
import { getHeadquarter, setHeadquarter } from '../models/headquarter.model.js';
import { getAliveMonsters, removeAliveMonsters } from '../models/monster-model.js';
import { calculateMonsterMove } from '../utils/calculateMonsterMove.js';
// x1000 y300 베이스 좌표
// 1000을 넘으면 총돌
// 헤드퀸터 충돌 처리

export const collideHandler = (userId, payload) => {
  const { monsters } = getGameAssets();
  const { monsterId, monsterIndex, monsterX, monsterY, timestamp } = payload;

  const createTime = getAliveMonsters(userId).find((monster) => {
    return monster.monsterId === monsterId && monster.monsterIndex === monsterIndex;
  }).timestamp;

  // 몬스터의 현재 위치 계산
  const severMonsterX = calculateMonsterMove(monsterId, monsterIndex, createTime);
  console.log('severMonsterX : ', severMonsterX);
  console.log('monsterX : ', monsterX);
  const tolerance = 200; // 허용 오차 범위 설정

  // 몬스터가 본부에 충돌했을 때 처리
  if (Math.abs(monsterX - severMonsterX) <= tolerance) {
    // 몬스터의 공격력 추출
    const monster = monsters.data.find((monster) => monster.id === monsterId);
    const monsterAttack = monster.attack;

    // 최신 본부 HP 가져오기
    const headquarter = getHeadquarter(userId); // 해당 사용자의 본부 HP 가져오기
    const currentHp = headquarter.length > 0 ? headquarter[headquarter.length - 1].hp : 0;

    // 플레이어 본부 HP 감소 로직 (HP가 0 미만이 되지 않도록 제한)
    const newHp = Math.max(0, currentHp - monsterAttack); // 최소 0으로 제한

    // 업데이트된 HP를 본부에 저장
    setHeadquarter(userId, newHp, Date.now()); // 새로운 HP 저장

    // 충돌한 몬스터도 aliveMonsters에서 빼줘야 하는데?
    removeAliveMonsters(userId, monsterId, monsterIndex);

    // 성공 응답 반환
    return {
      status: 'success',
      message: `본부 체력이 ${monsterAttack}만큼 감소했습니다!!`,
    };
  } else {
    // 차이를 계산하여 오류 메시지에 추가
    const difference = monsterX - severMonsterX;
    return {
      status: 'fail',
      message: `당신과 서버의 몬스터의 좌표가 ${difference} 만큼 다릅니다!!`,
    };
  }
};
