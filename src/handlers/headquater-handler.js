export const collideHandler = (userid, payload) => {
  const { monsters } = getGameAssets();
  const { monsterId, monsterIndex, monsterX, monsterY, timestamp } = payload;

  // 몬스터의 현재 위치 계산
  const currentMonsterX = calculateMonsterMove(
    monsterId,
    monsterIndex,
    timestamp,
  );

  const tolerance = 10; // 허용 오차 범위 설정

  // 몬스터가 본부에 충돌했을 때 처리
  if (Math.abs(monsterX - currentMonsterX) <= tolerance) {
    // 몬스터의 공격력 추출
    const monster = monsters.data.find(
      (monster) => monster.id === monsterId
    );
    const monsterAttack = monster.attack;

    // 최신 본부 HP 가져오기
    const headquater = getHeadquater(userid); // 해당 사용자의 본부 HP 가져오기
    const currentHp = headquater.length > 0 ? headquater[headquater.length - 1].hp : 0;

    // 플레이어 본부 HP 감소 로직 (HP가 0 미만이 되지 않도록 제한)
    const newHp = Math.max(0, currentHp - monsterAttack); // 최소 0으로 제한

    // 업데이트된 HP를 본부에 저장
    setHeadquater(userid, newHp, Date.now()); // 새로운 HP 저장

    // 반환값으로 newHp를 사용할 경우
    return newHp; // 만약 호출한 곳에서 newHp 값을 사용하려면 반환할 수 있음
  } else {
    // 차이를 계산하여 오류 메시지에 추가
    const difference = monsterX - currentMonsterX;

    // 오류 메시지에 더 많은 디버깅 정보를 포함
    throw new Error(
      `몬스터 충돌 오류: 
      몬스터 ID: ${monsterId}, 
      클라이언트 좌표: ${monsterX}, 
      서버 계산 좌표: ${currentMonsterX}, 
      차이: ${difference}, 
      타임스탬프: ${timestamp}`
    );
  }
};
