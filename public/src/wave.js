import { waveTable, sendEvent } from "./game.js ";

export class Wave {
  wave = 1;
  waveChange = true;
  isKillBoss = true;
  targetKillCount = 0;
  isClear = false;

  setWave() {
    this.targetKillCount = waveTable[this.wave - 1].monster_cnt;
    this.isKillBoss = true;
    this.waveChange = false;
  }

  update(monsterIndex) {
    if (this.targetKillCount <= 0) {
      if (this.wave === 5) {
        this.isClear = true;
        return;
      }
      this.waveChange = true;
    }
    if (this.waveChange) {
      const currentWaveId = waveTable[this.wave - 1].id;
      // 서버에 메세지 보냄
      sendEvent(51, {
        monsterIndex,
        currentWave: currentWaveId,
        targetWave: currentWaveId + 1,
        timestamp: Date.now(),
      });
      this.wave += 1;
      this.setWave();
    }
  }

  reset() {
    this.stage = 1;
    this.targetKillCount = 0;
    this.isClear = false;
  }

  getWave() {
    return this.wave;
  }
}
