import { getGameAssets } from "../inits/assets.js";

// 웨이브 상태 상수
export const WaveState = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  BOSS: "BOSS",
  COMPLETE: "COMPLETE",
};

class WaveModel {
  // 웨이브 모델 초기화
  // - 유저별 웨이브 정보를 저장할 Map 생성
  // - 게임 에셋 데이터 로드
  // - 최대 웨이브 수 설정
  constructor() {
    this.waves = new Map();
    this.assets = getGameAssets();
    this.maxWaves = 5; // 최대 웨이브 수 설정
  }

  // 새로운 유저의 웨이브 데이터 생성
  // - 웨이브 번호 1로 초기화
  // - 초기 상태를 WAITING으로 설정
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

  // 현재 웨이브의 기본 정보 반환
  // - 웨이브 번호에 해당하는 몬스터 수와 정보 반환
  // - 존재하지 않는 웨이브인 경우 null 반환
  getCurrentWaveData(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.currentWaveIndex >= this.maxWaves) return null;

    // wave.json의 데이터를 사용하여 현재 웨이브의 정보를 가져옴
    const waveData = this.assets.wave.data.find(
      (w) => w.id === 11 + wave.currentWaveIndex,
    );

    return {
      wave_number: wave.currentWaveIndex + 1,
      monster_cnt: waveData.monster_cnt, // 고정값 대신 wave.json의 데이터 사용
    };
  }

  // 현재 웨이브의 일반 몬스터 정보 반환
  // - 웨이브 번호에 맞는 몬스터 템플릿 반환
  // - 레벨과 능력치 정보 포함
  getCurrentMonsterData(userId) {
    const wave = this.waves.get(userId);
    if (!wave) return null;

    // 웨이브 번호에 맞는 몬스터 데이터 템플릿 제공
    const monsterId = 100 + (wave.currentWaveIndex + 1);
    const monsterTemplate = this.assets.monster.data.find(
      (monster) => monster.id === monsterId && monster.type === "monster",
    );

    console.log("Monster Template Data:", monsterTemplate); // 디버깅용
    return monsterTemplate;
  }

  // 현재 웨이브의 보스 몬스터 정보 반환
  // - 웨이브 번호에 맞는 보스 템플릿 반환
  // - 보스 고유 능력치와 패턴 정보 포함
  getCurrentBossData(userId) {
    const wave = this.waves.get(userId);
    if (!wave) return null;

    // 웨이브 번호에 맞는 보스 데이터 템플릿 제공
    const bossId = 200 + (wave.currentWaveIndex + 1);
    const bossTemplate = this.assets.monster.data.find(
      (monster) => monster.id === bossId && monster.type === "boss",
    );

    console.log("Boss Template Data:", bossTemplate); // 디버깅용
    return bossTemplate;
  }

  // 웨이브 시작 처리
  // - 상태를 WAITING에서 ACTIVE로 변경
  // - 몬스터 생성 및 초기화
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

  // 일반 몬스터 처치 시 처리
  // - 남은 몬스터 수 감소
  // - 모든 몬스터 처치 시 상태를 BOSS로 변경
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

  // 보스 몬스터 처치 시 처리
  // - 보스 처치 시 상태를 COMPLETE로 변경
  // - 웨이브 클리어 보상 처리
  handleBossKill(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.state !== WaveState.BOSS) return false;

    wave.bossKilled = true;
    wave.state = WaveState.COMPLETE;

    return true;
  }

  // 다음 웨이브로 진행
  // - 현재 웨이브가 COMPLETE 상태인지 확인
  // - 다음 웨이브 번호로 업데이트
  // - 상태를 WAITING으로 초기화
  progressToNextWave(userId) {
    const wave = this.waves.get(userId);
    if (!wave || wave.state !== WaveState.COMPLETE || !wave.bossKilled)
      return false;

    const nextWaveExists = wave.currentWaveIndex < this.maxWaves - 1;
    if (nextWaveExists) {
      wave.currentWaveIndex++;
      wave.state = WaveState.WAITING;
      wave.bossKilled = false;
      return true;
    }
    return false;
  }

  // 현재 웨이브 상태 정보 반환
  // - 웨이브 번호, 진행 상태, 남은 몬스터 수
  // - 현재 몬스터/보스 정보
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
