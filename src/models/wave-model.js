import { getGameAssets } from "../inits/assets.js";

// 웨이브 상태 상수
export const WaveState = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  BOSS: "BOSS",
  COMPLETE: "COMPLETE",
};

class WaveModel {
  constructor() {
    this.waves = new Map();
    this.assets = getGameAssets();
  }

  // 웨이브 생성
  createWave(userId) {
    this.waves.set(userId, {
      currentWaveIndex: 0,
      state: WaveState.WAITING,
      remainingMonsters: 0,
      currentMonster: null,
      currentBoss: null,
      bossKilled: false,
    });
  }

  // 현재 웨이브 데이터 가져오기
  getCurrentWaveData(userId) {
    const wave = this.waves.get(userId);
    if (!wave) return null;

    return this.assets.waves.data[wave.currentWaveIndex];
  }

  // 현재 몬스터 데이터 가져오기
  getCurrentMonsterData(userId) {
    const waveData = this.getCurrentWaveData(userId);
    if (!waveData) return null;

    return this.assets.monsters.data.find((monster) => monster.id === waveData.monster_id);
  }

  // 현재 보스 데이터 가져오기
  getCurrentBossData(userId) {
    const waveData = this.getCurrentWaveData(userId);
    if (!waveData) return null;

    return this.assets.bosses.data.find((boss) => boss.id === waveData.boss_id);
  }

  // 웨이브 시작
  startWave(userId) {
    const wave = this.waves.get(userId);
    if (!wave) return false;

    const waveData = this.getCurrentWaveData(userId);
    if (!waveData) return false;

    const monsterData = this.getCurrentMonsterData(userId);
    if (!monsterData) return false;

    wave.state = WaveState.ACTIVE;
    wave.remainingMonsters = waveData.monster_cnt;
    wave.currentMonster = monsterData;
    wave.currentBoss = null;
    wave.bossKilled = false;

    return true;
  }

  // 몬스터 처치 처리
  handleMonsterKill(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.state !== WaveState.ACTIVE) return false;

    wave.remainingMonsters--;

    // 모든 몬스터 처치 완료시 보스 단계로
    if (wave.remainingMonsters <= 0) {
      const bossData = this.getCurrentBossData(userId);
      if (!bossData) return false;

      wave.state = WaveState.BOSS;
      wave.currentBoss = bossData;
    }

    return true;
  }

  // 보스 처치 처리
  handleBossKill(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.state !== WaveState.BOSS) return false;

    wave.bossKilled = true;
    wave.state = WaveState.COMPLETE;

    return true;
  }

  // 다음 웨이브로 진행
  progressToNextWave(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.state !== WaveState.COMPLETE || !wave.bossKilled) return false;

    const nextWaveExists = wave.currentWaveIndex < this.assets.waves.data.length - 1;
    if (nextWaveExists) {
      wave.currentWaveIndex++;
      wave.state = WaveState.WAITING;
      wave.bossKilled = false;
      return true;
    }
    return false;
  }

  // 웨이브 상태 조회
  getWaveStatus(userId) {
    const wave = this.waves.get(userId);
    if (!wave) return null;

    return {
      waveNumber: wave.currentWaveIndex + 1,
      state: wave.state,
      remainingMonsters: wave.remainingMonsters,
      currentMonster: wave.currentMonster,
      currentBoss: wave.currentBoss,
      bossKilled: wave.bossKilled,
    };
  }
}

export const waveModel = new WaveModel();
