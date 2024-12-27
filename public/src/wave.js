export class Wave {
  wave = 1;
  waveChange = true;
  waveTarget = 0;
  isClear = false;


  update() {
    this.waveChange = true;
    if (
      Math.floor(this.time) === stageTable.data[this.wave - 1].duration &&
      this.waveChange
    ) {
      if (this.wave === 5) {
        return;
      }
      // 스테이지 이동 핸들러 실행 부분
      this.waveChange = false;
      this.wave += 1;
    }
  }

  gameClear() {
      this.isClear = true;
  }

  reset() {
    this.stage = 1;
    this.waveTarget = 0;
    this.isClear = false;
  }

  getWave() {
    return this.wave;
  }
}
