import { getGameAssets } from "../inits/assets.js";
import { rooms } from "../room/room.js";

/* 몬스터 생성 핸들러 31 */
export const createMonsterHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] 필요한 assets 데이터 가져오기 및 payload 데이터 추출
    let isBoss = false;
    const { monsters, waves } = getGameAssets(); // assets파일의 monsters, bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
    const { timestamp: createTime, waveId, monsterId, monsterIndex } = payload; //socket으로 받을 payload정보 리스트
    // [3] 생성된 몬스터의 정보 조회
    const monster = monsters.data.find((monster) => monster.id === monsterId);
    if (!monster) {
      return { status: "fail", message: "존재하지 않는 몬스터 id입니다." };
    }
    // [4] 몬스터 출현 스테이지 검증
    const spawnWave = waves.data.find((wave) => wave.id === waveId);
    if (spawnWave.monster_id !== monsterId && spawnWave.boss_id !== monsterId) {
      return {
        status: "fail",
        message: "해당 스테이지의 몬스터 id가 아닙니다.",
      };
    }
    // [5] 몬스터 개체수 검증
    if (spawnWave.monster_cnt < monsterIndex) {
      return { status: "fail", message: "몬스터가 너무 많이 나왔습니다." };
    }
    // [6] 보스몬스터 출현 검증
    if (monsterIndex === spawnWave.monster_cnt) {
      if (monsterId !== monster.id) {
        return { status: "fail", message: "보스몬스터가 잘못 나왔습니다." };
      }
    }
    // [7] 몬스터 정보 저장
    const monsterType = monster.type;
    const monsterHealth = monster.health;
    const monsterAttack = monster.attack;
    const monsterSpeed = monster.speed;
    const monsterGold = monster.gold;
    const monsterScore = monster.score;
    room.setAliveMonsters(
      createTime,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
    );
    // [8] 보스 여부 판별
    isBoss = monsterId > 200 ? true : false;
    // [9] 생성 성공 응답
    return {
      status: "success",
      message: "몬스터 생성 성공",
      monsterId,
      monsterType,
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
      monsterIndex,
      isBoss,
      handlerId: 31,
    };
  } catch (error) {
    throw new Error("몬스터 생성 실패 !! " + error.message);
  }
};

/* 몬스터 처치 핸들러 32 */
export const deathMonsterHandler = (userId, payload) => {
  try {
    // [1] 서버에서 해당 유저의 room 가져오기
    const room = rooms.find((room) => {
      return room.userId === userId;
    });
    // [2] payload에서 데이터 추출
    const {
      timestamp: deathTime,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterGold: cliGold,
      monsterScore: cliScore,
    } = payload;
    // [3] 몬스터 assets 데이터와 유저의 몬스터 데이터 가져오기
    const { monsters } = getGameAssets();
    const monsterAssetData = monsters.data.find(
      (monster) => monster.id === monsterId,
    );
    const aliveMonsters = room.getAliveMonsters();
    // [4] 죽은 몬스터가 유효한 몬스터인지 검증
    const monster = aliveMonsters.find(
      (monster) =>
        monster.monsterId === monsterId &&
        monster.monsterIndex === monsterIndex,
    );
    if (!monster) {
      return { status: "fail", message: "죽은 몬스터의 정보가 없습니다." };
    }
    // [5] 죽은 몬스터가 정말 체력이 0이 되었는지 검증
    if (monsterHealth > 0) {
      return { status: "fail", message: "몬스터가 아직 살아있었습니다." };
    }
    // [6] 해당 몬스터 생존 몬스터에서 배제
    room.removeAliveMonsters(monsterId, monsterIndex);
    // [7] 사망 몬스터에 추가
    room.setDeathMonsters(
      deathTime,
      monsterId,
      monsterIndex,
      monsterHealth,
      cliGold,
      cliScore,
    );
    // [8] 처치에 따른 골드 획득 처리
    // [8-1] 현재 보유 골드 조회
    const userGold = room.getGold();
    // [8-2] assets 데이터의 획득량과 클라이언트 획득량 비교 검증
    if (monsterAssetData.gold !== cliGold) {
      return { status: "fail", message: "Invalid monster gold" };
    }
    // [8-3] 서버에 획득 골드 최신화
    room.setGold(
      userGold.at(-1).totalGold + cliGold,
      cliGold,
      "KILL",
      deathTime,
    );
    // [9] 처치에 따른 점수 획득 처리
    // [9-1] 현재 보유 점수 조회
    const userScore = room.getScore();
    // [9-2] assets 데이터의 획득량과 클라이언트 획득량 비교 검증
    if (monsterAssetData.score !== cliScore) {
      return { status: "fail", message: "Invalid monster score" };
    }
    // [9-3] 서버에 획득 점수 최신화
    room.setScore(userScore.at(-1).totalScore + cliScore, cliScore, deathTime);
    // [10] 처치 성공 응답
    return {
      status: "success",
      message: "몬스터 처치!!",
      monsterHealth,
      monsterGold: cliGold, // 검증된 획득량이라 그대로 사용
      monsterScore: cliScore,
      handlerId: 32,
    };
  } catch (error) {
    throw new Error("몬스터 처치 실패!! " + error.message);
  }
};

/* CreateBossHandler 32 */
// export const createBossHandler = (userId, payload) => {
//   try {
//     const { bosses, waves } = getGameAssets(); //assets파일의 bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
//     const { timestamp, waveId, bossId } = payload; //socket으로 받을 payload정보 리스트
//     //timestamp는 소환시간 검증, bossId는 보스 정보 검증

//     //보스 정보 조회
//     const boss = bosses.data.find((boss) => boss.id === bossId);
//     if (!boss) {
//       return { status: "fail", message: "Invalid boss ID" };
//     }

//     //보스 출현 스테이지 검증
//     const bossWave = waves.data.find((wave) => wave.id === waveId);
//     if (bossWave.boss_id !== bossId) {
//       //waveId를 검증한 후 해당 bossId와 payload의 bossId 검증
//       return { status: "fail", message: "Invalid boss ID" };
//     }

//     //보스 소환 시간 검증

//     //보스 정보 저장
//     const bossHealth = boss.health;
//     const bossAttack = boss.attack;
//     const bossSpeed = boss.speed;
//     const bossGold = boss.gold;
//     const bossScore = boss.score;
//     setAliveBosses(
//       userId,
//       timestamp,
//       bossId,
//       bossHealth,
//       bossAttack,
//       bossSpeed,
//       bossGold,
//       bossScore,
//     );
//   } catch (error) {
//     throw new Error("Failed to create boss !! " + error.message);
//   }
// };

/* deathBossHandler 34 */
// export const deathBossHandler = (userId, payload) => {
//   const { bosses } = getGameAssets(); //assets파일의 monsters 정보 불러오기
//   const { timestamp, bossId, x, y } = payload; //payloal 정보
//   //보스 ID, 이동한 좌표(이동 전도 가져와도됨)

//   //여기서 보스 ...
//   //const
// };

//클라이언트에서 몬스터가 이동한 코드대로 서버에서도 이동시키기 => 몬스터 움직임 하나하나를 검증할 필요없음
