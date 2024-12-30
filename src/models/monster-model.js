// 몬스터의 현재 위치정보, 체력, 아이디, 생성시간, 스테이지아이디, 보유 골드, (여기서 인덱스 만들기)

const aliveMonsters = {};

const deathMonsters = {};

// const aliveBosses = {};

// const deathBosses = {};

//살아있는 몬스터 배열 만들기
export const createAliveMonsters = (userId) => {
  aliveMonsters[userId] = [];
};

//죽은 몬스터 배열 만들기
export const createDeathMonsters = (userId) => {
  deathMonsters[userId] = [];
};

//살아있는 몬스터 데이터 가져오기
export const getAliveMonsters = (userId) => {
  return aliveMonsters[userId];
};

//살아있는 몬스터 데이터 저장하기
export const setAliveMonsters = (
  userId,
  timestamp,
  monsterId,
  monsterIndex,
  monsterHealth,
  monsterAttack,
  monsterSpeed,
  monsterGold,
  monsterScore,
) => {
  return aliveMonsters[userId].push({
    timestamp,
    monsterId,
    monsterIndex,
    monsterHealth,
    monsterAttack,
    monsterSpeed,
    monsterGold,
    monsterScore,
  });
};

//살아있는 몬스터 데이터 지우기 (filter가 다른 녀석도 배제하는 오류가 있길래 splice로 바꿨읍니다...)
export const removeAliveMonsters = (userId, monsterId, monsterIndex) => {
  const targetIndex = aliveMonsters[userId].findIndex(
    (monster) =>
      monster.monsterId === monsterId && monster.monsterIndex === monsterIndex,
  );
  if (targetIndex !== -1) {
    aliveMonsters[userId].splice(targetIndex, 1);
  }
};

//죽은 몬스터 데이터 가져오기
export const getDeathMonsters = (userId) => {
  return deathMonsters[userId];
};

//죽은 몬스터 데이터 저장하기
export const setDeathMonsters = (
  userId,
  timestamp,
  monsterId,
  monsterIndex,
  monsterHealth,
  monsterGold,
  monsterScore,
) => {
  return deathMonsters[userId].push({
    timestamp,
    monsterId,
    monsterIndex,
    monsterHealth,
    monsterGold,
    monsterScore,
  });
};

//여기부터 보스
//살아있는 보스 배열 만들기
// export const createAliveBosses = (userId) => {
//   aliveBosses[userId] = [];
// };

//죽은 보스 배열 만들기
// export const createDeathBosses = (userId) => {
//   deathBosses[userId] = [];
// };

//살아있는 보스 데이터 가져오기
// export const getAliveBosses = (userId) => {
//   return aliveBosses[userId];
// };

//살아있는 보스 데이터 저장하기
// export const setAliveBosses = (
//   userId,
//   timestamp,
//   bossId,
//   bossHealth,
//   bossAttack,
//   bossSpeed,
//   bossGold,
//   bossScore,
// ) => {
//   return aliveBosses[userId].push({
//     timestamp,
//     bossId,
//     bossHealth,
//     bossAttack,
//     bossSpeed,
//     bossGold,
//     bossScore,
//   });
// };

//죽은 보스 데이터 가져오기
// export const getDeathBosses = (userId) => {
//   return deathBosses[userId];
// };

//죽은 보스 데이터 저장하기
// export const setDeathBosses = (userId) => {
//   return deathBosses[userId].push({
//     timestamp,
//     bossId,
//     bossHealth,
//     bossAttack,
//     bossSpeed,
//     bossGold,
//     bossScore,
//   });
// };
