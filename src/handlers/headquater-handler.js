import { getGameAssets } from "../inits/assets.js";

// x1000 y300 베이스 좌표
//1000을 넘으면 총돌
// 헤드퀸터 충돌 처리
export const collideHandler = (userid, payload) => {
  const { monsters } = getGameAssets();
  //지금 몬스터 마다 공격력을 가지고 있다.충돌했을떄 hp 감소
  //이걸 충돌했을떄 이 핸들러를 호출하는 함수를 만들어야함
  //받아오는것는 몬스터 아이디, 몬스터 인덱스, 몬스터 좌표
  //각자 필요한 이유 몬스터 아이디는 클라이에서 생성된 각각의 몬스터마다 붙는 id이고 이걸 통해서 검증을 시도해야함 {monsterIndex} 몬스터 객체 번호
  //몬스터 인덱스는 몬스터 종류를 알려주는것으로 이걸로 몬스터의 공격력을 알수 있음 {monseterid}
  //몬스터 좌표는 이걸 통해서 몬스터가 어디에 있는지 알아서 충돌했는지 여부를 알수있음 {monsterX, monsterY}
  //하지만 이것은 분명 오차가 발생함 오차 범위를 지정해주어야 한다.
  //이걸 통해서 충돌했는지 여부를 알수 있음
  const { monsterId, monsterIndex, monsterX, monsterY } = payload;

  //몬스터 Id로 몬스터 좌표 가져오기
  const getMonsterAttack = (id) => {
    return monsters[id]?.attack || 0; // 공격력이 없을 경우 0 반환
  };

  // 몬스터 공격력 가져오기
  const monsterAttack = getMonsterAttack(monsterId);

  //본부 좌표는 고정되어 있지만 몬스터 좌표는 계속 변경되어 있음
};
