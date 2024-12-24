import { getGameAssets } from "../inits/assets.js";

const waves = {};

// 웨이브 생성 및 초기화
export const createWave = (userId) => {
  const { wave } = getGameAssets();
  waves[userId] = {
    currentWaveIndex: 0, // 현재 웨이브 인덱스
    waveData: wave.data, // 웨이브 데이터
    currentEnemies: [], // 현재 웨이브 몬스터
    isActive: false, // 웨이브 활성 여부
    remainingMonsters: 0, // 남은 몬스터 수
    bossSpawned: false, // 보스 소환 여부
  };
  return waves[userId];
};

// 웨이브 상태 조회
export const getWaveStatus = (userId) => {
  return waves[userId];
};

// 웨이브 몬스터 삭제
export const removeEnemy = (userId, enemyUniqueId) => {
  const wave = waves[userId];
  if (!wave) return null;

  // 몬스터 인덱스 조회
  const enemyIndex = wave.currentEnemies.findIndex((e) => e.uniqueId === enemyUniqueId);
  if (enemyIndex !== -1) {
    const enemy = wave.currentEnemies[enemyIndex];
    wave.currentEnemies.splice(enemyIndex, 1);
    if (enemy.type === "monster") {
      wave.remainingMonsters--;
    }
    return enemy;
  }
  return null;
};

export const isWaveComplete = (userId) => {
  const wave = waves[userId];
  return wave.remainingMonsters === 0 && wave.bossSpawned && wave.currentEnemies.length === 0;
};

// 다음 웨이브 진행
export const progressToNextWave = (userId) => {
  const wave = waves[userId];
  if (wave.currentWaveIndex < wave.waveData.length - 1) {
    wave.currentWaveIndex++;
    wave.isActive = false;
    return true;
  }
  return false;
};

// 몬스터 존재 여부 검증
export const validateEnemy = (userId, enemyUniqueId) => {
  const wave = waves[userId];
  if (!wave) return { valid: false, message: "웨이브가 존재하지 않습니다." };

  const enemy = wave.currentEnemies.find((e) => e.uniqueId === enemyUniqueId);
  if (!enemy) return { valid: false, message: "해당 몬스터가 존재하지 않습니다." };

  return {
    valid: true,
    enemy,
    type: enemy.type,
    isActive: wave.isActive,
  };
};

// 웨이브 유효성 검증
export const validateWave = (userId) => {
  const wave = waves[userId];
  if (!wave) return { valid: false, message: "웨이브가 존재하지 않습니다." };

  return {
    valid: true,
    currentWave: wave.currentWaveIndex + 1,
    isActive: wave.isActive,
    bossSpawned: wave.bossSpawned,
    remainingMonsters: wave.remainingMonsters,
  };
};
