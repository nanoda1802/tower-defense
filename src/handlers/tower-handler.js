import { getGameAssets } from '../inits/assets.js';
import { PAWN_TOWER_COST, SPECIAL_TOWER_COST, TOWER_TYPE_PAWN, TOWER_TYPE_SPECIAL, MONSTER_TYPE, BOSS_TYPE, TOWER_COLOR_BLACK, TOWER_COLOR_RED } from '../constants.js';
import { getTower, setTower, removeTower, upgradeTower, getRemoveTower } from '../models/tower-model.js';
import { getGold, setGold } from '../models/gold-model.js';
import { getAliveBosses, getAliveMonsters, setDeathMonsters, setDeathBosses, getDeathMonsters, getDeathBosses } from '../models/monster-model.js';

const TOWER_TYPE_BUFF = 'buffer';
const BUFF_VALUE = 50;

export const getTowerHandler = (userId, payload) => {
  try {
    const { pawnTowers, specialTowers } = getGameAssets();
    const { type, color, positionX, positionY, timestamp } = payload;

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    if (userTowers.some((tower) => tower.positionX === positionX && tower.positionY === positionY)) {
      return {
        status: 'fail',
        message: 'There is already a tower at that location',
      };
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
      // if (probability >= 0 && probability < 49.5) {
      //   towerInfo = specialTowers.data[4]; //K-red
      // } else if (probability >= 49.5 && probability < 99) {
      //   towerInfo = specialTowers.data[5]; //K-black
      // } else if (probability > 99 && probability <= 100) {
      //   towerInfo = specialTowers.data[6]; //Joker
      // }
    }

    setTower(userId, positionX, positionY, type, timestamp, towerInfo, false, null, []);
    // console.log(getTower(userId));

    return {
      status: 'success',
      cost,
      gold: resGold,
      positionX: positionX,
      positionY: positionY,
      type: type,
      data: towerInfo,
    };
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

    /*** (추가) 버프타워용
     *  CASE1. 버프 타워가 아닌 경우 (버프 적용된 일반 타워만)
     *  - towerInfo 객체에서 buffTowerPos 값의 버프 타워를 찾아 buffTowerArr 목록에서 자기 자신을 지워줘야함
     *  CASE2. 버프 타워인 경우
     *  - towerInfo 객체의 buffTowerArr 목록의 타워들을 버프 전 상태로 원복 시켜야함.
     */
    // if (TOWER_TYPE_BUFF !== towerInfo.data.type) {
    //   if (towerInfo.isGetBuff) {
    //     const buffTowerPos = towerInfo.buffTowerPos.split(',');
    //     const buffTower = userTowers.find((tower) => tower.positionX === buffTowerPos[0] && tower.positionY === buffTowerPos[1]);
    //     const index = buffTower.buffTowerArr.findIndex((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
    //     if (index !== -1) {
    //       return buffTower.buffTowerArr.splice(index, 1)[0];
    //     }
    //   }
    // } else {
    //   towerInfo.buffTowerArr.forEach((tower) => {
    //     changeBuffStatus(tower, false, null);
    //   });
    // }

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

    return {
      status: 'success',
      gold: userGold[userGold.length - 1].gold,
      price,
    };
    // return {
    //   status: 'success',
    //   gold: userGold[userGold.length - 1].gold,
    //   price,
    //   towers: getTower(userId),
    // };
  } catch (error) {
    throw new Error('Failed to sellTowerHandler !! ' + error.message);
  }
};

/* 타워 승급 43 */
export const upgradeTowerHandler = (userId, payload) => {
  try {
    const { type, towerId, positionX, positionY, timestamp } = payload;

    // 특수 타워 업글 방지
    if (type === TOWER_TYPE_SPECIAL) {
      return { status: 'fail', message: 'Special tower can not upgrade' };
    }

    // 1. 기준정보 (towerId)
    const res = checkTowerAsset(type, towerId);
    if (res) return { status: 'fail', message: res };

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    const towerInfo = userTowers.find((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
    if (!towerInfo) {
      return { status: 'fail', message: 'There is not a tower' };
    }

    /** 3. 골드 처리
     *  일반 : 카드 숫자 * 2
     *  특수 : 카드 숫자 * 2 (일단 제외)
     */
    const userGold = getGold(userId);
    if (!userGold) {
      return { status: 'fail', message: 'No gold data for user' };
    }

    // 나중에 특수 카드도 강화 하게 되면 아래 사용
    // const x = 2;
    // const cost = towerInfo.data.card === 'J' ? 11 * x : towerInfo.data.card === 'Q' ? 12 * x  : towerInfo.data.card === 'K' ? 13 * x : Number(towerInfo.data.card) * x;
    const cost = Number(towerInfo.data.card) * 2;

    // 보유 골드 체크
    if (userGold[userGold.length - 1].gold < cost) {
      return { status: 'fail', message: 'Not enough money' };
    }

    setGold(userId, userGold[userGold.length - 1].gold - cost, cost, 'UPGRADE', timestamp);
    // console.log(getGold(userId));

    // 4. 타워 업글 처리
    upgradeTower(userId, towerId, positionX, positionY);

    return {
      status: 'success',
      gold: userGold[userGold.length - 1].gold,
      cost,
      positionX: towerInfo.positionX,
      positionY: towerInfo.positionY,
      type: towerInfo.type,
      data: towerInfo.data,
    };
  } catch (error) {
    throw new Error('Failed to upgradeTowerHandler !! ' + error.message);
  }
};

/* 공격 타워 (공격) 44 */
export const attackTowerHandler = (userId, payload) => {
  // const { pawnTowers, specialTowers, monsters, bosses } = getGameAssets();
  try {
    const { towerType, towerId, towerPositionX, towerPositionY, monsterType, monsterId, monsterPositionX, monsterPositionY, timestamp } = payload;

    // 0. 타워 및 몬스터 Type 유효성 검사
    if (towerType !== TOWER_TYPE_PAWN && towerType !== TOWER_TYPE_SPECIAL) {
      return { status: 'fail', message: 'Invalid tower type' };
    }

    if (monsterType !== MONSTER_TYPE && monsterType !== BOSS_TYPE) {
      return { status: 'fail', message: 'Invalid monster type' };
    }

    /** 1. 기준정보 체크
     *  타워, 몬스터 (일반,보스)
     */

    // 타워
    const towerRes = checkTowerAsset(towerType, towerId);
    if (towerRes) return { status: 'fail', message: towerRes };

    // 몬스터
    const mosterRes = checkMosterAsset(monsterType, monsterId);
    if (mosterRes) return { status: 'fail', message: mosterRes };

    // 2. 설치한 타워가 맞는지 검증 (위치 포함)
    const userTowers = getTower(userId);
    const towerInfo = userTowers.find((tower) => tower.data.id === towerId && tower.positionX === towerPositionX && tower.positionY === towerPositionY);
    if (!towerInfo) {
      return { status: 'fail', message: 'There is not a tower' };
    }

    // J,Q 타워 체크 (J,Q 는 전용 핸들러가 따로 있음)
    if (towerInfo.data.card === 'J' || towerInfo.data.card === 'Q') {
      return {
        status: 'fail',
        message: `'${towerInfo.data.card}' tower cannot be processed by this handler`,
      };
    }

    // 3. 생존한 몬스터가 맞는지 검증 (위치 포함)
    const aliveTargets = monsterType === MONSTER_TYPE ? getAliveMonsters(userId) : getAliveBosses(userId);
    const targetInfo = aliveTargets.find((target) => target.monsterId === monsterId && target.positionX === monsterPositionX && target.positionY === monsterPositionY);
    if (!targetInfo) {
      return {
        status: 'fail',
        message: `There is not a ${monsterType === MONSTER_TYPE ? 'moster' : 'boss'}`,
      };
    }

    //  4. 공격 사거리 검증
    const distance = Math.sqrt(Math.pow(towerInfo.positionX - targetInfo.positionX, 2) + Math.pow(towerInfo.positionY - targetInfo.positionY, 2));
    if (distance >= towerInfo.data.range) {
      return { status: 'fail', message: 'This is not a valid attack' };
    }

    /*** 5. 공격 처리
     * 5-1. 체력 감소
     * 5-2. (조건) 몬스터 체력이 0이면 사망처리 / 골드 획득 처리
     *
     * 타워 공격 유형
     * [색상(일반,특수 - 공통)]
     * 검정 : 단일 공격
     * 빨강 : 범위 공격
     *
     * [성능]
     * - 일반 타워: 특수 효과X
     * - J 타워: 본인 사거리 안에 아군 타워 버프 (다른 핸들러에서 처리)
     * - Q 타워: 공격력 만큼 몬스터 이동속도 감소 (다른 핸들러에서 처리)
     * - K 타워: 공격력 사거리 우월
     * - JOKER 타워: 공격력, 공격속도, 사거리, 공격범위 우월
     */
    // 일반 타워 특수 타워
    const monsterArr = [];
    const bossArr = [];
    if (towerInfo.data.color === TOWER_COLOR_BLACK) {
      //단일 공격
      attackDamage(userId, monsterType, towerInfo, targetInfo, timestamp);
      monsterType === MONSTER_TYPE ? monsterArr.push(targetInfo) : bossArr.push(targetInfo);
    } else if (towerInfo.data.color === TOWER_COLOR_RED || towerInfo.data.card === 'joker') {
      // 몬스터 생존 정보 조회
      const alliveMonsters = getAliveMonsters(userId);
      // const alliveBosses = getAliveBosses(userId);

      alliveMonsters.forEach((monster) => {
        checkSplashAttack(userId, monster, MONSTER_TYPE, monsterPositionX, monsterPositionY, towerInfo, targetInfo, monsterArr, timestamp);
      });

      // alliveBosses.forEach((boss) => {
      //   checkSplashAttack(userId, boss, MONSTER_TYPE, monsterPositionX, monsterPositionY, towerInfo, targetInfo, bossArr, timestamp);
      // });
    }

    return {
      status: 'success',
      monsters: monsterArr,
      bosses: bossArr,
    };
  } catch (error) {
    throw new Error('Failed to attackTowerHandler !! ' + error.message);
  }
};

/* 버프 타워 (공격) 45 */
export const buffTowerHandler = (userId, payload) => {
  try {
    const { towerId, positionX, positionY } = payload;

    /** 1. 기준정보 체크
     *  타워, 몬스터 (일반,보스)
     */

    // 타워
    const towerRes = checkTowerAsset(TOWER_TYPE_SPECIAL, towerId);
    if (towerRes) return { status: 'fail', message: towerRes };

    // 2. 위치 + 타워Id + 버프타워 여부 체크
    const userTowers = getTower(userId);
    const towerInfo = userTowers.find((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY && tower.data.type === 'buffer');
    if (!towerInfo) {
      return { status: 'fail', message: 'There is not a tower' };
    }

    // 3. 생성된 타워가 오직 자기 자신뿐이면 return
    if (userTowers.length === 1) {
      return {
        status: 'success',
        message: 'There are no target towers to buff',
      };
    }

    // 4. 버프 처리
    for (let i = 0; i < userTowers.length; i++) {
      // 대상 조건 : 자기 자신이 아닌 타워여야 하고 버프효과를 안받고 있는 타워
      if ((positionX !== userTowers[i].positionX || positionY !== userTowers[i].positionY) && !userTowers[i].isGetBuff && userTowers[i].data.type !== 'buffer') {
        const distance = getDistance(positionX, positionY, userTowers[i].positionX, userTowers[i].positionY);
        // 버프 타워 기준으로 유효한 거리인 타워에게만 버프 효과 부여
        if (distance < towerInfo.data.range) {
          changeBuffStatus(userTowers[i], true, positionX + ',' + positionY);
          towerInfo.buffTowerArr.push(userTowers[i]); //버프 타워의 대상 목록에 추가

          // 검정 J 타워는 대상 1개 / 빨강 J 타워는 대상 여러개 (최대 미정)
          if (towerInfo.data.color === TOWER_COLOR_BLACK) break;
        }
      }
    }

    // 버프 받은 타워 목록 return
    return { status: 'success', towers: towerInfo.buffTowerArr };
  } catch (error) {
    throw new Error('Failed to buffTowerHandler !! ' + error.message);
  }
};

/* 감속 타워 (공격) 46 */
export const slowTowerHandler = (userId, payload) => {};
// const checkAsset = (id, assets) => {
//   return assets.data.some((asset) => asset.id === id);
// };

/** 타워 Asset 정보 체크 */
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

/** 몬스터 Asset 정보 체크 */
const checkMosterAsset = (type, monsterId) => {
  const { bosses, monsters } = getGameAssets();
  // 타워 유형에 대한 검증
  if (type === MONSTER_TYPE) {
    // 기준정보 유무 체크 (pawnTowers)
    if (!monsters.data.some((monster) => monster.id === monsterId)) {
      return 'No boss found for asset';
    }
  } else if (type === BOSS_TYPE) {
    // 기준정보 유무 체크 (specialTower)
    if (!bosses.data.some((boss) => boss.id === monsterId)) {
      return 'No monster found for asset';
    }
  } else {
    // Type 값이 유효하지 않으면 Err
    return 'Invalid monster type';
  }

  return null;
};

/** 공격처리 (몬스터 체력 감소 처리) */
const attackDamage = (userId, monsterType, towerInfo, targetInfo, timestamp) => {
  targetInfo.monsterHealth = targetInfo.monsterHealth - towerInfo.data.attack < 0 ? 0 : targetInfo.monsterHealth - towerInfo.data.attack;

  // 몬스터 HP가 0이면
  // if (targetInfo.monsterHealth === 0) {
  //   // 골드 획득 처리
  //   const userGold = getGold(userId);
  //   setGold(userId, userGold[userGold.length - 1].gold + targetInfo.monsterGold, targetInfo.monsterGold, 'KILL', timestamp);

  //   // 사망 처리
  //   if (monsterType === MONSTER_TYPE) {
  //     //일반 몬스터
  //     setDeathMonsters(userId);
  //   } else {
  //     //보스 몬스터
  //     setDeathBosses(userId);
  //   }
  // }
};

// 범위 공격 처리 함수
const checkSplashAttack = (userId, monster, monsterType, monsterPositionX, monsterPositionY, towerInfo, targetInfo, arr, timestamp) => {
  if (monster.positionX !== monsterPositionX || monster.positionY !== monsterPositionY) {
    //타워의 공격 대상 기준으로 타워의 범위 수치만큼 거리안에 있는 몬스터를 찾는다
    const distance = Math.sqrt(Math.pow(targetInfo.positionX - monster.positionX, 2) + Math.pow(targetInfo.positionY - monster.positionY, 2));
    if (distance < towerInfo.data.splash) {
      //공격 처리
      attackDamage(userId, monsterType, towerInfo, monster, timestamp);
      arr.push(monster);
    }
  } else if (monster.positionX === monsterPositionX && monster.positionY === monsterPositionY) {
    //타겟 몬스터 처리
    attackDamage(userId, monsterType, towerInfo, monster, timestamp);
    arr.push(monster);
  }
};

//거리 계산 (좌표 기준)
const getDistance = (baseX, baseY, targetX, targetY) => {
  return Math.sqrt(Math.pow(baseX - targetX, 2) + Math.pow(baseY - targetY, 2));
};

//버프 상태 변경 함수
const changeBuffStatus = (towerInfo, isBuff, positionXY) => {
  isBuff ? (towerInfo.data.attack += BUFF_VALUE) : (towerInfo.data.attack -= BUFF_VALUE);
  towerInfo.isGetBuff = isBuff; //버프 여부
  towerInfo.buffTowerPos = positionXY; //버프 타워의 좌표 값
};
