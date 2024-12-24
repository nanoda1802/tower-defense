import { getGameAssets } from '../inits/assets.js';
import { PAWN_TOWER_COST, SPECIAL_TOWER_COST } from '../constants.js';
import { getTower, setTower, removeTower, upgradeTower, getRemoveTower } from '../models/tower-model.js';
import { getGold, setGold } from '../models/gold-model.js';

const TOWER_TYPE_PAWN = 'pawn';
const TOWER_TYPE_SPECIAL = 'special';

export const getTowerHandler = (userId, payload) => {
  try {
    const { pawnTowers, specialTowers } = getGameAssets();
    const { type, color, positionX, positionY, timestamp } = payload;

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    if (userTowers.some((tower) => tower.positionX === positionX && tower.positionY === positionY)) {
      return { status: 'fail', message: 'There is already a tower at that location' };
    }

    // 3. 보유 골드 확인
    const cost = type === TOWER_TYPE_PAWN ? PAWN_TOWER_COST : SPECIAL_TOWER_COST;
    const userGold = getGold(userId);

    if (!userGold) {
      return { status: 'fail', message: 'No gold data for user' };
    }

    if (userGold[userGold.length - 1].gold < cost) {
      return { status: 'fail', message: 'Not enough money' };
    }

    // 5. 골드 처리
    const resGold = userGold[userGold.length - 1].gold - cost;
    setGold(userId, resGold, -cost, 'PURCHASE', timestamp);
    // console.log(getGold(userId));

    /** 6. 타워 생성
     * 기본타워 : 기본 카드는 '1' 색상은 입력 값
     * 특수타워 : 랜덤 획득
     *  - J(빨) : 16.5% , J(검) :16.5% , Q(빨) : 16.5% , J(검) :16.5% , K(빨) : 16.5% , J(검) :16.5% [99%]
     *  - JOKER : 1%                                                                                [ 1%]
     */
    let towerInfo = null;
    if (type === TOWER_TYPE_PAWN) {
      /*일반 타워*/

      // Color 체크
      if (color !== 'red' && color !== 'black') {
        return { status: 'fail', message: 'Invalid color' };
      }

      towerInfo = pawnTowers.data.find((tower) => tower.color === color);
      towerInfo.card = '1';
    } else {
      /*특수 타워*/

      const probability = Math.floor(Math.random() * 1001) / 10;
      if (probability >= 0 && probability <= 16.5) {
        towerInfo = specialTowers.data[0]; //J-red
      } else if (probability > 16.5 && probability <= 33) {
        towerInfo = specialTowers.data[1]; //J-black
      } else if (probability > 33 && probability <= 49.5) {
        towerInfo = specialTowers.data[2]; //Q-red
      } else if (probability > 49.5 && probability <= 66) {
        towerInfo = specialTowers.data[3]; //Q-black
      } else if (probability > 66 && probability <= 82.5) {
        towerInfo = specialTowers.data[4]; //K-red
      } else if (probability > 82.5 && probability <= 99) {
        towerInfo = specialTowers.data[5]; //K-black
      } else if (probability > 99 && probability < 100) {
        towerInfo = specialTowers.data[6]; //Joker
      }
    }

    setTower(userId, positionX, positionY, type, timestamp, towerInfo);
    // console.log(getTower(userId));

    return { status: 'success', gold: resGold, tower: getTower(userId) };
  } catch (error) {
    throw new Error('Failed to getTowerHandler !! ' + error.message);
  }
};

/* 타워 판매 42 */
export const sellTowerHandler = (userId, payload) => {
  try {
    const { type, towerId, positionX, positionY, timestamp } = payload;

    // 1. 기준정보 (towerId)
    const res = checkTowerAsset(type, towerId);
    if (res) return { status: 'fail', message: res };

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    const towerInfo = userTowers.find((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
    if (!towerInfo) {
      return { status: 'fail', message: 'There is not a tower' };
    }

    /** 3. 판매처리 (골드)
     *  일반 : 뽑기 금액 / 2 * 카드숫자
     *  특수 : 뽑기 금액 / 2
     */
    const userGold = getGold(userId);
    if (!userGold) {
      return { status: 'fail', message: 'No gold data for user' };
    }
    const price = towerInfo.type === TOWER_TYPE_PAWN ? (PAWN_TOWER_COST / 2) * Number(towerInfo.data.card) : SPECIAL_TOWER_COST / 2;

    setGold(userId, userGold[userGold.length - 1].gold + price, price, 'SELL', timestamp);
    // console.log(getGold(userId));

    // 4. 판매처리 (타워)
    removeTower(userId, towerId, positionX, positionY);
    // console.log(getTower(userId));
    // console.log(getRemoveTower(userId));

    return { status: 'success', gold: 5 };
  } catch (error) {
    throw new Error('Failed to sellTowerHandler !! ' + error.message);
  }
};

/* 타워 승급 43 */
export const upgradeTowerHandler = (userId, payload) => {
  const { type, towerId, positionX, positionY } = payload;

  // 1. 기준정보 (towerId)
  const res = checkTowerAsset(type, towerId);
  if (res) return { status: 'fail', message: res };

  // 2. position(x,y) 위치에 towerId가 존재하는지
  const userTowers = getTower(userId);
  if (!userTowers.some((tower) => tower.towerId === towerId && tower.positionX === positionX && tower.positionY === positionY)) {
    return { status: 'fail', message: 'There is not a tower' };
  }

  // 3. 보유 골드 체크
  const userGold = getGold(userId);
  if (!userGold) {
    return { status: 'fail', message: 'No gold data for user' };
  }

  // 4. 타워 승급 처리
  upgradeTower(userId);

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

const checkTowerAsset = (type, towerId) => {
  const { pawnTowers, specialTowers } = getGameAssets();
  // 타워 유형에 대한 검증
  if (type === TOWER_TYPE_PAWN) {
    // 기준정보 유무 체크 (pawnTowers)
    if (!pawnTowers.data.some((tower) => tower.id === towerId)) {
      return 'No pawn found for asset';
    }
  } else if (type === TOWER_TYPE_SPECIAL) {
    // 기준정보 유무 체크 (specialTower)
    if (!specialTowers.data.some((tower) => tower.id === towerId)) {
      return 'No special found for asset';
    }
  } else {
    // Type 값이 유효하지 않으면 Err
    return 'Invalid tower type';
  }

  return null;
};
