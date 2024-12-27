import { waveTable } from "./game.js ";

export class Wave {
  wave = 1;
  waveChange = true;
  targetKillCount = 0;
  isClear = false;

  setWave() {
    this.targetKillCount = waveTable[this.wave - 1].monster_cnt;
    this.waveChange = false;
  }

  update() {
    if (this.targetKillCount <= 0) {
      this.waveChange = true;
      if (this.wave === 5) {
        this.gameClear();
        return;
      }
    }
    if (this.waveChange) {
      // sendEvent()
      this.wave += 1;
      this.setWave();
    }
  }

  gameClear() {
    this.isClear = true;
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
