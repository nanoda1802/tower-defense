import { getGameAssets } from "../inits/assets.js";
import { rooms } from "../room/room.js";
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
import { calculateMonsterMove } from "../utils/calculateMonsterMove.js";

/* 필요 변수 생성 */
const TOWER_TYPE_BUFF = "buffer";
const BUFF_ATTACK_VALUE = 20;
const BUFF_ATTACK_SPEED_VALUE = 0.5;

/* 타워 설치 핸들러 */
export const getTowerHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] 필요한 assets 데이터 가져오기 및 payload 데이터 추출
    const { pawnTowers, specialTowers } = getGameAssets();
    const { type, color, positionX, positionY, timestamp } = payload;
    // [3] 선택된 위치에 이미 설치된 타워가 있는지 검증
    const userTowers = room.getTowers();
    if (
      userTowers.some(
        (tower) =>
          tower.positionX === positionX && tower.positionY === positionY,
      )
    ) {
      return {
        status: "fail",
        message: "이미 타워가 설치된 위치임다!!",
      };
    }
    // [4] 유저가 보유한 골드로 설치 비용을 지불할 수 있는지 검증
    // [4-1] 보유 골드 및 필요 비용 확인
    const userGold = room.getGold();
    const cost =
      type === TOWER_TYPE_PAWN ? PAWN_TOWER_COST : SPECIAL_TOWER_COST;
    // [4-2] 보유 골드과 확인되지 않으면 거부
    if (!userGold) {
      return { status: "fail", message: "골드 진행 사항이 없는 유저임다!!" };
    }
    // [4-3] 지불 능력이 안 되면 거부
    if (userGold.at(-1).totalGold < cost) {
      return { status: "fail", message: "골드가 모자랍니다!!" };
    }
    // [5] 설치 비용 지불 후 보유 골드 최신화
    const resGold = userGold.at(-1).totalGold - cost;
    room.setGold(resGold, -cost, "PURCHASE", timestamp);
    // [6] 타워 설치 준비
    // pawn : card 속성 기본 값은 "1", color는 요청받은 값 "red" 또는 "black"
    // special : card 속성은 "J", "Q", "K", "Joker", 랜덤 획득 (조커 1%, 그 외 균등 확률)
    let towerInfo = null;
    // [6-1 A] pawn 타워 검증 및 정보 찾기
    if (type === TOWER_TYPE_PAWN) {
      // 유효한 color를 요청받은 건지 검증
      if (color !== "red" && color !== "black") {
        return { status: "fail", message: "그런 색의 카드는 없어요!!" };
      }
      // assets 데이터에서 해당 타워의 정보 가져옴
      towerInfo = pawnTowers.data.find((tower) => tower.color === color);
    } else {
      // [6-1 B] special 타워 랜덤 선택
      const probability = Math.floor(Math.random() * 1001) / 10;
      if (probability >= 0 && probability <= 16.5) {
        towerInfo = specialTowers.data[0]; // J-red
      } else if (probability > 16.5 && probability <= 33) {
        towerInfo = specialTowers.data[1]; // Q-red
      } else if (probability > 33 && probability <= 49.5) {
        towerInfo = specialTowers.data[2]; // K-red
      } else if (probability > 49.5 && probability <= 66) {
        towerInfo = specialTowers.data[3]; // J-black
      } else if (probability > 66 && probability <= 82.5) {
        towerInfo = specialTowers.data[4]; // Q-black
      } else if (probability > 82.5 && probability <= 99) {
        towerInfo = specialTowers.data[5]; // K-black
      } else if (probability > 99 && probability < 100) {
        towerInfo = specialTowers.data[6]; // Joker
      }
    }
    // [7] 설치될 타워 서버에 저장
    room.setTower(
      positionX,
      positionY,
      type,
      timestamp,
      Object.assign({}, towerInfo),
      false,
      null,
      null,
    );
    // [8] 설치 성공 응답
    return {
      status: "success",
      cost,
      gold: resGold,
      positionX: positionX,
      positionY: positionY,
      type,
      data: towerInfo,
    };
  } catch (error) {
    throw new Error("Failed to getTowerHandler !! " + error.message);
  }
};

/* 타워 판매 42 */
export const sellTowerHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] payload에서 필요 데이터 추출
    const { type, towerId, positionX, positionY, timestamp } = payload;
    // [3] assets 데이터에 존재하는 타워인지 검증
    const res = checkTowerAsset(type, towerId);
    if (res) return { status: "fail", message: res };
    // [4] 선택된 위치에 타워를 보유하고 있는지 검증
    const userTowers = room.getTowers();
    const towerInfo = userTowers.find(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY,
    );
    if (!towerInfo) {
      return { status: "fail", message: "판매할 타워가 없는 위치임다!!" };
    }
    // [추가] 버프 주체 및 버프 대상 타워 판매 처리
    let buffValue = 0;
    let buffTowerPos = "";
    // [추가 A] 버프 타워가 아닌 경우 (판매할 타워가 J가 아닌 경우)
    if (TOWER_TYPE_BUFF !== towerInfo.data.type) {
      // [A-1] 그 타워가 J에게 버프를 받고 있다면
      if (towerInfo.isGetBuff) {
        const buffTowerPos = towerInfo.buffTowerPos.split(",");
        const buffTower = userTowers.find(
          (tower) =>
            tower.positionX === Number(buffTowerPos[0]) &&
            tower.positionY === Number(buffTowerPos[1]),
        );
        // [A-2] J의 버프 대상을 초기화
        buffTower.buffTarget = null;
      }
    } else {
      // [추가 B] 버프 타워인 경우 (판매할 타워가 J인 경우)
      // [B-1] 버프를 주고 있는 현황 초기화
      changeBuffStatus(towerInfo.buffTarget, false, null, towerInfo.data.color);
      // [B-2] 클라이언트에서 동일한 처리 위한 버프 수치 할당
      buffValue =
        towerInfo.data.color === TOWER_COLOR_BLACK
          ? BUFF_ATTACK_VALUE
          : BUFF_ATTACK_SPEED_VALUE;
    }
    // [5] 판매에 대한 골득 획득 처리
    // pawn : 설치 비용의 절반에 승급 수치를 곱한 값 (6강 pawn 판매 시 10/2*6)
    // special : 설치 비용의 절반 값
    // [5-1] 유저 보유 골드 현황 조회 및 검증
    const userGold = room.getGold();
    if (!userGold) {
      return { status: "fail", message: "골드 진행 사항이 없는 유저임다!!" };
    }
    // [5-2] 판매 시 획득할 골드 확인
    const price =
      towerInfo.type === TOWER_TYPE_PAWN
        ? (PAWN_TOWER_COST / 2) * Number(towerInfo.data.card)
        : SPECIAL_TOWER_COST / 2;
    // [5-3] 골드 획득에 따른 보유 골드 최신화
    room.setGold(userGold.at(-1).totalGold + price, price, "SELL", timestamp);
    // [6] 판매된 타워 활성 타워 목록에서 제거
    room.removeTower(towerId, positionX, positionY);
    // [7] 판매 성공 응답
    return {
      status: "success",
      gold: userGold.at(-1).totalGold,
      price,
      buffValue,
    };
  } catch (error) {
    throw new Error("Failed to sellTowerHandler !! " + error.message);
  }
};

/* 타워 승급 43 */
export const upgradeTowerHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] payload에서 필요 데이터 추출
    const { type, towerId, positionX, positionY, timestamp } = payload;
    // [3] 특수 타워는 승급 불가 처리
    if (type === TOWER_TYPE_SPECIAL) {
      return { status: "fail", message: "특수 타워는 승급시킬 수 없습니다!!" };
    }
    // [3] assets 데이터에 존재하는 타워인지 검증
    const res = checkTowerAsset(type, towerId);
    if (res) return { status: "fail", message: res };
    // [4] 선택된 위치에 타워를 보유하고 있는지 검증
    const userTowers = room.getTowers();
    const towerInfo = userTowers.find(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY,
    );
    if (!towerInfo) {
      return { status: "fail", message: "승급할 타워가 없는 위치임다!!" };
    }
    // [5] 승급 비용에 대한 골드 처리 (pawn 타워만 가능, 비용은 card 속성 값의 두 배)
    // [5-1] 유저의 보유 골드 조회
    const userGold = room.getGold();
    if (!userGold) {
      return { status: "fail", message: "골드 진행 사항이 없는 유저임다!!" };
    }
    // [5-2] 승급 비용 계산
    const cost = Number(towerInfo.data.card) * 2;
    // [5-3] 보유량으로 비용 지불 불가할 시 거부
    if (userGold.at(-1).totalGold < cost) {
      return { status: "fail", message: "골드가 모자릅니다!!" };
    }
    // [6] 비용 지불 후 보유 골드 최신화
    room.setGold(userGold.at(-1).totalGold - cost, cost, "UPGRADE", timestamp);
    // [7] 승급 대상 타워 능력치 증가
    room.upgradeTower(towerId, positionX, positionY);
    // [8] 승급 성공 응답
    return {
      status: "success",
      gold: userGold.at(-1).totalGold,
      cost,
      positionX: towerInfo.positionX,
      positionY: towerInfo.positionY,
      type: towerInfo.type,
      data: towerInfo.data,
    };
  } catch (error) {
    throw new Error("Failed to upgradeTowerHandler !! " + error.message);
  }
};

/* 공격 타워 (공격) 44 */
export const attackTowerHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] payload에서 필요 데이터 추출
    const {
      towerType,
      towerId,
      towerPositionX,
      towerPositionY,
      monsterType,
      monsterId,
      monsterPositionX,
      monsterPositionY,
      timestamp,
      monsterIndex,
    } = payload;
    // [3] 유효한 타워 타입인지, 유효한 몬스터 타입인지 검증
    if (towerType !== TOWER_TYPE_PAWN && towerType !== TOWER_TYPE_SPECIAL) {
      return { status: "fail", message: "타워의 타입이 유효하지 않슴다!!" };
    }
    if (monsterType !== MONSTER_TYPE && monsterType !== BOSS_TYPE) {
      return { status: "fail", message: "몬스터의 타입이 유효하지 않슴다!!" };
    }
    // [4] 공격하는 타워와 공격받는 몬스터가 assets 데이터에 존재하는지 검증
    const towerRes = checkTowerAsset(towerType, towerId);
    if (towerRes) return { status: "fail", message: towerRes };
    const monsterRes = checkMonsterAsset(monsterType, monsterId);
    if (monsterRes) return { status: "fail", message: monsterRes };
    // [5] 유저가 보유한 타워가 맞는지 검증
    const userTowers = room.getTowers();
    const towerInfo = userTowers.find(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === towerPositionX &&
        tower.positionY === towerPositionY,
    );
    if (!towerInfo) {
      return { status: "fail", message: "보유한 타워가 아니랍니다!!" };
    }
    // [6] 버프 타워가 공격하려 하진 않는지 검증
    if (towerInfo.data.card === "J") {
      return {
        status: "fail",
        message: `'${towerInfo.data.card}' 타워에 맞는 핸들러가 아님다!!`,
      };
    }
    // [7] 살아있는 몬스터를 공격하는 게 맞는지 검증
    const aliveTargets = room.getAliveMonsters();
    if (aliveTargets.length === 0) {
      return {
        status: "fail",
        message: "공격할 생존 몬스터가 존재하지 않슴다!!",
      };
    }
    const targetInfo = aliveTargets.find(
      (target) =>
        target.monsterId === monsterId && target.monsterIndex === monsterIndex,
    );
    if (!targetInfo) {
      return {
        status: "fail",
        message: `공격할 ${monsterType === MONSTER_TYPE ? "monster" : "boss"} 대상을 찾을 수 없슴다!! `,
      };
    }
    // [8] 몬스터 이동에 조작이 있진 않은 지 검증하기 위한 서버 시뮬레이션 데이터 가져오기
    const tolerance = 200;
    const calculateX = calculateMonsterMove(
      monsterId,
      monsterIndex,
      targetInfo.timestamp, // 타겟 몬스터 스폰 시간
    );
    // [9] 타워의 공격 범위 인식이 유효했는지 검증
    const distance = Math.sqrt(
      Math.pow(towerInfo.positionX - calculateX, 2) +
        Math.pow(towerInfo.positionY - monsterPositionY, 2),
    );
    if (Math.abs(distance - towerInfo.data.range) > tolerance) {
      return { status: "fail", message: "공격 범위 밖의 대상입니다!!" };
    }
    // [10] 공격에 따른 몬스터 체력 감소 처리 (광역 공격 기획의 잔재가 남아있읍니다...)
    const monsterArr = [];
    // [10-1] 검정 카드는 단일 공격
    if (towerInfo.data.color === TOWER_COLOR_BLACK) {
      attackDamage(userId, monsterType, towerInfo, targetInfo, timestamp);
      monsterArr.push(targetInfo);
    } else if (
      towerInfo.data.color === TOWER_COLOR_RED ||
      towerInfo.data.card === "joker"
    ) {
      // [10-2] 빨강 카드 및 조커는 광역 공격
      const aliveMonsters = room.getAliveMonsters();
      aliveMonsters.forEach((monster) => {
        checkSplashAttack(
          userId,
          monster,
          MONSTER_TYPE,
          monsterPositionX,
          monsterPositionY,
          towerInfo,
          targetInfo,
          monsterArr,
          timestamp,
        );
      });
    }
    // [11] 공격 성공 응답
    return {
      status: "success",
      monsters: monsterArr,
    };
  } catch (error) {
    throw new Error("Failed to attackTowerHandler !! " + error.message);
  }
};

/* 버프 타워 (공격) 45 */
export const buffTowerHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] payload에서 필요 데이터 추출
    const { towerId, positionX, positionY } = payload;
    // [3] 버프 타워가 assets 데이터에 존재하는지 검증
    const towerRes = checkTowerAsset(TOWER_TYPE_SPECIAL, towerId);
    if (towerRes) return { status: "fail", message: towerRes };

    // [4] 유저가 이 타워를 보유했는지, 버프를 줄 다른 타워가 있는지 검증
    const userTowers = room.getTowers();
    const towerInfo = userTowers.find(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY &&
        tower.data.type === "buffer",
    );
    if (!towerInfo) {
      return { status: "fail", message: "버프 타워를 가지고 있지 않슴다!!" };
    }
    if (userTowers.length === 1) {
      return {
        status: "success",
        message: "버프를 받을 다른 타워가 없슴다!!",
      };
    }
    // [5] 버프에 따른 능력치 상승 적용
    for (let i = 0; i < userTowers.length; i++) {
      // [5-1] 버프 타워 본인 제외, 미버프 상태인 타워 물색
      if (
        (positionX !== userTowers[i].positionX ||
          positionY !== userTowers[i].positionY) &&
        !userTowers[i].isGetBuff &&
        userTowers[i].data.type !== "buffer"
      ) {
        // [5-2] 버프 타워의 사거리 내에 있는 타워에 적용
        const distance = getDistance(
          positionX,
          positionY,
          userTowers[i].positionX,
          userTowers[i].positionY,
        );
        if (distance < towerInfo.data.range) {
          changeBuffStatus(
            userTowers[i],
            true,
            positionX + "," + positionY,
            towerInfo.data.color,
          );
          // [5-3] 버프 줄 대상 타워 버프 목록에 추가
          towerInfo.buffTarget = userTowers[i];
          break;
        }
      }
    }
    // [6] 버프 성공 응답
    return {
      status: "success",
      buffTarget: towerInfo.buffTarget,
      buffValue:
        towerInfo.data.color === TOWER_COLOR_BLACK
          ? BUFF_ATTACK_VALUE
          : BUFF_ATTACK_SPEED_VALUE,
      color: towerInfo.data.color,
    };
  } catch (error) {
    throw new Error("Failed to buffTowerHandler !! " + error.message);
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
const checkMonsterAsset = (type, monsterId) => {
  const { monsters } = getGameAssets();

  // 타워 유형에 대한 검증
  if (type === MONSTER_TYPE) {
    // 기준정보 유무 체크 (pawnTowers)
    if (
      !monsters.data.some(
        (monster) => monster.id === monsterId && monster.type === MONSTER_TYPE,
      )
    ) {
      return "No monster found for asset";
    }
  } else if (type === BOSS_TYPE) {
    // 기준정보 유무 체크 (pawnTowers)
    if (
      !monsters.data.some(
        (monster) => monster.id === monsterId && monster.type === BOSS_TYPE,
      )
    ) {
      return "No boss found for asset";
    }
  } else {
    // Type 값이 유효하지 않으면 Err
    return "Invalid monster type";
  }

  return null;
};

/** 공격처리 (몬스터 체력 감소 처리) */
const attackDamage = (
  userId,
  monsterType,
  towerInfo,
  targetInfo,
  timestamp,
) => {
  targetInfo.monsterHealth =
    targetInfo.monsterHealth - towerInfo.data.attack < 0
      ? 0
      : targetInfo.monsterHealth - towerInfo.data.attack;

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
const checkSplashAttack = (
  userId,
  monster,
  monsterType,
  monsterPositionX,
  monsterPositionY,
  towerInfo,
  targetInfo,
  arr,
  timestamp,
) => {
  if (
    monster.positionX !== monsterPositionX ||
    monster.positionY !== monsterPositionY
  ) {
    //타워의 공격 대상 기준으로 타워의 범위 수치만큼 거리안에 있는 몬스터를 찾는다
    const distance = Math.sqrt(
      Math.pow(targetInfo.positionX - monster.positionX, 2) +
        Math.pow(targetInfo.positionY - monster.positionY, 2),
    );
    if (distance < towerInfo.data.splash) {
      //공격 처리
      attackDamage(userId, monsterType, towerInfo, monster, timestamp);
      arr.push(monster);
    }
  } else if (
    monster.positionX === monsterPositionX &&
    monster.positionY === monsterPositionY
  ) {
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
const changeBuffStatus = (towerInfo, isBuff, positionXY, color) => {
  if (color === TOWER_COLOR_BLACK) {
    // 공격
    isBuff
      ? (towerInfo.data.attack += BUFF_ATTACK_VALUE)
      : (towerInfo.data.attack -= BUFF_ATTACK_VALUE);
  } else {
    // 공속
    isBuff
      ? (towerInfo.data.attack_speed += BUFF_ATTACK_SPEED_VALUE)
      : (towerInfo.data.attack_speed -= BUFF_ATTACK_SPEED_VALUE);
  }
  towerInfo.isGetBuff = isBuff; //버프 여부
  towerInfo.buffTowerPos = positionXY; //버프 타워의 좌표 값
};
