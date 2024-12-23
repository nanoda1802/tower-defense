import { getGameAssets } from '../inits/assets';
import { PAWN_TOWER_COST, SPECIAL_TOWER_COST } from '../constants';
import { getTower } from '../models/tower-model';
/* 타워 생성-공통 41 */

export const getTowerHandler = (userId, payload) => {
  // [ payload : towerId, type , position(x,y)  ]

  const { type, towerId, positionX, positionY } = payload;
  const { pawnTowers, specialTowers } = getGameAssets();

  // 타워 유형에 대한 검증
  if (type === 'pawn') {
    // 기준정보 유무 체크 (pawnTowers)
    if (!pawnTowers || pawnTowers.data.length === 0) {
      return { status: 'fail', message: 'No pawn tower Data' };
    }
  } else if (type === 'special') {
    // 기준정보 유무 체크 (specialTower)
    if (!specialTowers || specialTowers.data.length === 0) {
      return { status: 'fail', message: 'No special tower Data' };
    }
  } else {
    // 클라이언트에서 Type 값이 유효하지 않으면 Err
    return { status: 'fail', message: 'Invalid tower type' };
  }

  // position(x,y)에 대한 검증
  const userTowers = getTower(userId);
  if (userTowers.data.some((tower) => tower.positionX === positionX && tower.positionY === positionY)) {
    return { status: 'fail', message: 'There is already a tower at that location.' };
  }

  // 보유 골드 검증

  return { status: 'success', gold: PAWN_TOWER_COST };
};
/* 타워 판매 42 */
export const sellTowerHandler = (userId, payload) => {
  // [ payload : towerId, position(x,y)]
  // 1. 기준정보 (towerId)
  //  2. position(x,y) 위치에 towerId가 존재하는지

  removeTower(userId, towerId, positionX, positionY);

  //  3. return { status : "success" , gold : 10 } <- gold는 보유 총량을 반환해도 되고 증감치를 반환해도 됨. (선택)
};
/* 타워 승급 43 */
export const upgradeTowerHandler = (userId, payload) => {
  // [ payload : towerId(currentTowerId) , towerId(nextTowerId) , position(x,y)/타워 고유값 ]
  //  1. 기준정보 (towerId) - 현재 등급 타워
  //  2. 기준정보 (towerId) - 다음 등급 타워
  //  3. 승급 시 현재타워에서 다음 타워가 맞는지 검증.
  //  4. position(x,y) 위치에 towerId가 존재하는지 검증.
  //  5. 보유골드 검증
  //  6. return { monsterHp : 1 , gold : 0} / return { monsterHp : 0 , gold : 5}  <- gold는 보유 총량을 반환해도 되고 증감치를 반환해도 됨. (선택)
};
/* 타워 공격 44 */
export const attackHandler = (userId, payload) => {
  // [ payload : towerId , monsterId, towerPosition(x,y)/타워 고유값 , monsterPosition(x,y)/몬스터 고유값 ]
  //  1. 기준정보 (towerId)
  //  2. 기준정보 (monsterId)
  //  3. 설치한 타워가 맞는지 검증 (위치 포함)
  //  4. 생존한 몬스터가 맞는지 검증 (위치 포함)
  //  5. 공격 사거리 검증
  //  6-1. 몬스터 체력 변경
  //  6-2. (조건). 몬스터 체력 0 이면 몬스터 처치 및 보유 골드 변경 처리
  //  7. return { monsterHp : 1 , gold : 0} / return { monsterHp : 0 , gold : 5} <- gold는 보유 총량을반환해도 되고 증감치를 반환해도 됨. (선택)
};
