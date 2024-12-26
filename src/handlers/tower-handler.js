import { getGameAssets } from "../inits/assets.js";
import {
  PAWN_TOWER_COST,
  SPECIAL_TOWER_COST,
  TOWER_TYPE_PAWN,
  TOWER_TYPE_SPECIAL,
  MONSTER_TYPE,
  BOSS_TYPE,
  TOWER_COLOR_BLACK,
  TOWER_COLOR_RED,
} from "../constants.js";
import {
  getTower,
  setTower,
  removeTower,
  upgradeTower,
  getRemoveTower,
} from "../models/tower-model.js";
import { getGold, setGold } from "../models/gold-model.js";
import {
  getAliveBosses,
  getAliveMonsters,
  setDeathMonsters,
  setDeathBosses,
} from "../models/monster-model.js";

export const getTowerHandler = (userId, payload) => {
  try {
    const { pawnTowers, specialTowers } = getGameAssets();
    const { type, color, positionX, positionY, timestamp } = payload;

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    if (
      userTowers.some(
        (tower) =>
          tower.positionX === positionX && tower.positionY === positionY,
      )
    ) {
      return {
        status: "fail",
        message: "There is already a tower at that location",
      };
    }

    // 3. 보유 골드 확인
    const cost =
      type === TOWER_TYPE_PAWN ? PAWN_TOWER_COST : SPECIAL_TOWER_COST;
    const userGold = getGold(userId);

    if (!userGold) {
      return { status: "fail", message: "No gold data for user" };
    }

    if (userGold[userGold.length - 1].gold < cost) {
      return { status: "fail", message: "Not enough money" };
    }

    // 6. 타워 생성
    // setTower(userId, towerId, positionX, positionY);
    // 5. 골드 처리
    const resGold = userGold[userGold.length - 1].gold - cost;
    setGold(userId, resGold, -cost, "PURCHASE", timestamp);
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
      if (color !== "red" && color !== "black") {
        return { status: "fail", message: "Invalid color" };
      }

      towerInfo = pawnTowers.data.find((tower) => tower.color === color);
      towerInfo.card = "1";
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

    return {
      status: "success",
      gold: resGold,
      positionX: positionX,
      positionY: positionY,
      type: type,
      data: towerInfo,
    };
  } catch (error) {
    throw new Error("Failed to getTowerHandler !! " + error.message);
  }
};

/* 타워 판매 42 */
export const sellTowerHandler = (userId, payload) => {
  try {
    const { type, towerId, positionX, positionY, timestamp } = payload;

    // 1. 기준정보 (towerId)
    const res = checkTowerAsset(type, towerId);
    if (res) return { status: "fail", message: res };

    // 2. position(x,y) 위치에 towerId가 존재하는지
    const userTowers = getTower(userId);
    const towerInfo = userTowers.find(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY,
    );
    if (!towerInfo) {
      return { status: "fail", message: "There is not a tower" };
    }

    /** 3. 판매처리 (골드)
     *  일반 : 뽑기 금액 / 2 * 카드숫자
     *  특수 : 뽑기 금액 / 2
     */
    const userGold = getGold(userId);
    if (!userGold) {
      return { status: "fail", message: "No gold data for user" };
    }
    const price =
      towerInfo.type === TOWER_TYPE_PAWN
        ? (PAWN_TOWER_COST / 2) * Number(towerInfo.data.card)
        : SPECIAL_TOWER_COST / 2;

    setGold(
      userId,
      userGold[userGold.length - 1].gold + price,
      price,
      "SELL",
      timestamp,
    );
    // console.log(getGold(userId));

    // 4. 판매처리 (타워)
    removeTower(userId, towerId, positionX, positionY);
    // console.log(getTower(userId));
    // console.log(getRemoveTower(userId));

    return {
      status: "success",
      gold: userGold[userGold.length - 1].gold,
      price,
    };
  } catch (error) {
    throw new Error("Failed to sellTowerHandler !! " + error.message);
  }
};

/* 타워 승급 43 */
export const upgradeTowerHandler = (userId, payload) => {
  const { type, towerId, positionX, positionY, timestamp } = payload;

  // 특수 타워 업글 방지
  if (type === TOWER_TYPE_SPECIAL) {
    return { status: "fail", message: "Special tower can not upgrade" };
  }

  // 1. 기준정보 (towerId)
  const res = checkTowerAsset(type, towerId);
  if (res) return { status: "fail", message: res };

  // 2. position(x,y) 위치에 towerId가 존재하는지
  const userTowers = getTower(userId);
  const towerInfo = userTowers.find(
    (tower) =>
      tower.data.id === towerId &&
      tower.positionX === positionX &&
      tower.positionY === positionY,
  );
  if (!towerInfo) {
    return { status: "fail", message: "There is not a tower" };
  }

  /** 3. 골드 처리
   *  일반 : 카드 숫자 * 2
   *  특수 : 카드 숫자 * 2 (일단 제외)
   */
  const userGold = getGold(userId);
  if (!userGold) {
    return { status: "fail", message: "No gold data for user" };
  }

  // 나중에 특수 카드도 강화 하게 되면 아래 사용
  // const x = 2;
  // const cost = towerInfo.data.card === 'J' ? 11 * x : towerInfo.data.card === 'Q' ? 12 * x  : towerInfo.data.card === 'K' ? 13 * x : Number(towerInfo.data.card) * x;
  const cost = Number(towerInfo.data.card) * 2;

  // 보유 골드 체크
  if (userGold[userGold.length - 1].gold < cost) {
    return { status: "fail", message: "Not enough money" };
  }

  setGold(
    userId,
    userGold[userGold.length - 1].gold - cost,
    cost,
    "UPGRADE",
    timestamp,
  );
  // console.log(getGold(userId));

  // 4. 타워 업글 처리
  upgradeTower(userId, towerId, positionX, positionY);

  return {
    status: "success",
    gold: userGold[userGold.length - 1].gold,
    cost,
    positionX: towerInfo.positionX,
    positionY: towerInfo.positionY,
    type: towerInfo.type,
    data: towerInfo.data,
  };
};

/* 타워 공격 44 */
export const attackHandler = (userId, payload) => {
  const { pawnTowers, specialTowers, monsters, bosses } = getGameAssets();
  const {
    towerType,
    towerId,
    towerPositionX,
    towerPositionY,
    monsterType,
    monsterId,
    monsterPositionX,
    monsterPositionY,
  } = payload;

  // 0. 타워 및 몬스터 Type 유효성 검사
  if (towerType !== TOWER_TYPE_PAWN && towerType !== TOWER_TYPE_SPECIAL) {
    return { status: "fail", message: "Invalid tower type" };
  }

  if (monsterType !== MONSTER_TYPE && monsterType !== BOSS_TYPE) {
    return { status: "fail", message: "Invalid monster type" };
  }

  /** 1. 기준정보 체크
   *  타워, 몬스터 (일반,보스)
   */

  // 타워
  const towerRes = checkTowerAsset(towerType, towerId);
  if (towerRes) return { status: "fail", message: towerRes };

  // 몬스터
  const mosterRes = checkMosterAsset(monsterType, monsterId);
  if (mosterRes) return { status: "fail", message: mosterRes };

  // 2. 설치한 타워가 맞는지 검증 (위치 포함)
  const userTowers = getTower(userId);
  const towerInfo = userTowers.find(
    (tower) =>
      tower.data.id === towerId &&
      tower.positionX === towerPositionX &&
      tower.positionY === towerPositionY,
  );
  if (!towerInfo) {
    return { status: "fail", message: "There is not a tower" };
  }

  // 3. 생존한 몬스터가 맞는지 검증 (위치 포함)
  const aliveTargets =
    monsterType === MONSTER_TYPE
      ? getAliveMonsters(userId)
      : getAliveBosses(userId);
  const targetInfo = aliveTargets.find(
    (target) =>
      target.id === towerId &&
      target.positionX === monsterPositionX &&
      target.positionY === monsterPositionY,
  );
  if (!targetInfo) {
    return {
      status: "fail",
      message: `There is not a ${monsterType === MONSTER_TYPE ? "moster" : "boss"}`,
    };
  }

  //  4. 공격 사거리 검증
  const distance = Math.sqrt(
    Math.pow(towerInfo.positionX - targetInfo.positionX, 2) +
      Math.pow(towerInfo.positionY - targetInfo.positionY, 2),
  );
  if (distance >= towerInfo.data.range) {
    return { status: "fail", message: "This is not a valid attack" };
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
   * - J 타워: 본인 사거리 안에 아군 타워 버프
   * - Q 타워: 공격력 만큼 몬스터 이동속도 감소
   * - K 타워: 공격력 사거리 우월
   * - JOKER 타워: 공격력, 공격속도, 사거리, 공격범위 우월
   */
  // 일반 타워 특수 타워
  const monsterArr = [];
  const bossArr = [];
  if (towerInfo.data.color === TOWER_COLOR_BLACK) {
    //단일 공격
    towerAttack(userId, monsterType, towerInfo, targetInfo, timestamp);
    monsterArr.put(targetInfo);
  } else {
    //타워의 공격 대상 기준으로 타워의 범위 수치만큼 거리안에 있는 몬스터를 찾는다

    // 몬스터 생존 정보 조회
    const alliveMonsters = getAliveMonsters(userId);
    const alliveBosses = getAliveBosses(userId);

    alliveMonsters.forEach((monster) => {
      const distance = Math.sqrt(
        Math.pow(targetInfo.positionX - monster.positionX, 2) +
          Math.pow(targetInfo.positionY - monster.positionY, 2),
      );
      if (distance < towerInfo.data.range) {
        monsterArr.push(monster);
      }
    });

    alliveBosses.forEach((boss) => {
      const distance = Math.sqrt(
        Math.pow(targetInfo.positionX - boss.positionX, 2) +
          Math.pow(targetInfo.positionY - boss.positionY, 2),
      );
      if (distance < towerInfo.data.range) {
        bossArr.push(boss);
      }
    });

    //범위 공격
    monsterArr.forEach((monster) => {
      towerAttack(userId, monsterType, towerInfo, monster, timestamp);
    });

    //범위 공격
    bossArr.forEach((boss) => {
      towerAttack(userId, monsterType, towerInfo, monster, timestamp);
    });
  }

  const userGold = getGold(userId);
  return {
    monsterHp: 1,
    gold: userGold[userGold.length - 1].gold,
    monsters: monsterArr,
    bosses: bossArr,
  };
};

export const buffTowerHandler = (userId, payload) => {};

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
      return "No pawn found for asset";
    }
  } else if (type === TOWER_TYPE_SPECIAL) {
    // 기준정보 유무 체크 (specialTower)
    if (!specialTowers.data.some((tower) => tower.id === towerId)) {
      return "No special found for asset";
    }
  } else {
    // Type 값이 유효하지 않으면 Err
    return "Invalid tower type";
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
      return "No boss found for asset";
    }
  } else if (type === BOSS_TYPE) {
    // 기준정보 유무 체크 (specialTower)
    if (!bosses.data.some((boss) => boss.id === monsterId)) {
      return "No monster found for asset";
    }
  } else {
    // Type 값이 유효하지 않으면 Err
    return "Invalid monster type";
  }

  return { bosses, monsters };
};

/** 타워 공격 (몬스터 체력 감소 처리) */
const towerAttack = (userId, monsterType, towerInfo, targetInfo, timestamp) => {
  targetInfo.health =
    targetInfo.health - towerInfo.data.attack < 0 ? 0 : targetInfo.health;

  // 몬스터 HP가 0이면
  if (targetInfo.health === 0) {
    // 골드 획득 처리
    const userGold = getGold(userId);
    setGold(
      userId,
      userGold[userGold.length - 1].gold + targetInfo.gold,
      targetInfo.gold,
      "KILL",
      timestamp,
    );

    // 사망 처리
    if (monsterType === MONSTER_TYPE) {
      //일반 몬스터
      setDeathMonsters(userId);
    } else {
      //보스 몬스터
      setDeathBosses(userId);
    }
  }
};

// function isMonsterInRange(tower, monster, range) {
//   const dx = monster.x - tower.x;
//   const dy = monster.y - tower.y;
//   const distance = Math.sqrt(dx * dx + dy * dy); // 유클리드 거리 계산
//   return distance <= range;
// }

// // 타워와 몬스터의 위치
// const tower = { x: 5, y: 5 }; // 타워 위치
// const monster = { x: 8, y: 7 }; // 몬스터 위치
// const range = 5; // 타워의 공격 범위

// // 검증
// if (isMonsterInRange(tower, monster, range)) {
//   console.log('몬스터가 공격 범위 안에 있습니다!');
// } else {
//   console.log('몬스터가 공격 범위를 벗어났습니다.');
// }

// function isMonsterInRangeOptimized(tower, monster, range) {
//   const dx = monster.x - tower.x;
//   const dy = monster.y - tower.y;
//   const squaredDistance = dx * dx + dy * dy; // 제곱 거리 계산
//   const squaredRange = range * range;
//   return squaredDistance <= squaredRange;
// }

// // 같은 테스트
// if (isMonsterInRangeOptimized(tower, monster, range)) {
//   console.log('몬스터가 공격 범위 안에 있습니다!');
// } else {
//   console.log('몬스터가 공격 범위를 벗어났습니다.');
// }

// const monsters = [
//   { x: 8, y: 7 },
//   { x: 2, y: 3 },
//   { x: 6, y: 6 },
// ];

// monsters.forEach((monster, index) => {
//   if (isMonsterInRangeOptimized(tower, monster, range)) {
//     console.log(`몬스터 ${index + 1}는 공격 범위 안에 있습니다.`);
//   } else {
//     console.log(`몬스터 ${index + 1}는 공격 범위를 벗어났습니다.`);
//   }
// });
