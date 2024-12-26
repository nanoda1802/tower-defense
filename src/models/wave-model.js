// import { getGameAssets } from "../inits/assets.js";

const waves = {
  tester: {
    currentWaveIndex: 0,
    isActive: false,
    remainingMonsters: 20,
    bossSpawned: false,
  },
};
const removeWaves = { tester: [] };

export const createWave = (userId) => {
  waves[userId] = {
    currentWaveIndex: 0,
    isActive: false,
    remainingMonsters: 0,
    bossSpawned: false,
  };
};

export const getWave = (userId) => {
  return waves[userId];
};

export const clearWave = (userId) => {
  waves[userId] = {
    currentWaveIndex: 0,
    isActive: false,
    remainingMonsters: 0,
    bossSpawned: false,
  };
};

export const clearRemoveWave = (userId) => {
  removeWaves[userId] = [];
};

export const validateWave = (userId) => {
  const wave = waves[userId];
  if (!wave) {
    return { valid: false, message: "웨이브가 존재하지 않습니다.", isActive: false };
  }
  return { valid: true, isActive: wave.isActive };
};

export const validateMonster = (userId) => {
  const wave = waves[userId];
  if (!wave) {
    return { valid: false, message: "웨이브가 존재하지 않습니다.", isActive: false };
  }
  if (!wave.isActive) {
    return { valid: false, message: "진행 중인 웨이브가 없습니다.", isActive: false };
  }
  if (wave.remainingMonsters <= 0) {
    return { valid: false, message: "처치할 몬스터가 없습니다.", isActive: true };
  }
  return { valid: true, isActive: true };
};

export const validateBoss = (userId) => {
  const wave = waves[userId];
  if (!wave) {
    return { valid: false, message: "웨이브가 존재하지 않습니다.", isActive: false };
  }
  if (!wave.isActive) {
    return { valid: false, message: "진행 중인 웨이브가 없습니다.", isActive: false };
  }
  if (!wave.bossSpawned) {
    return { valid: false, message: "보스가 아직 등장하지 않았습니다.", isActive: true };
  }
  return { valid: true, isActive: true };
};

export const isWaveComplete = (userId) => {
  const wave = waves[userId];
  return wave.remainingMonsters === 0 && wave.bossSpawned;
};

// 다음 웨이브 진행
export const progressToNextWave = (userId) => {
  const wave = waves[userId];
  if (wave.currentWaveIndex < 4) {
    // wave.json의 데이터 길이 - 1
    wave.currentWaveIndex++;
    wave.isActive = false;
    wave.bossSpawned = false;
    return true;
  }
  return false;
};

export const startWave = (userId, waveData) => {
  const wave = waves[userId];
  wave.isActive = true;
  wave.remainingMonsters = waveData.monster_cnt;
  wave.bossSpawned = false;
};
