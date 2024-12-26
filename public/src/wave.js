export class Wave {
  wave = 1;
  waveChange = true;
  waveTarget = 0;
  isClear = false;
  constructor(ctx, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.scaleRatio = scaleRatio;
  }

  update(deltaTime) {
    this.waveChange = true;
    // 플레이 시간이 설정된 스테이지 데이터 변경 시간이 되면 서버에 메세지 전송
    if (
      Math.floor(this.time) === stageTable.data[this.wave - 1].duration &&
      this.waveChange
    ) {
      if (this.wave === 5) {
        return;
      }
      // 스테이지 이동 핸들러 실행 부분
      sendEvent(11, {
        currentStage: stageTable.data[this.wave - 1].id,
        targetStage: stageTable.data[this.wave].id,
      });
      this.waveChange = false;
      this.wave += 1;
    }
  }

  gameClear() {
    if (this.wave === 5 && this.time >= stageTable.data[4].duration) {
      this.isClear = true;
    }
  }

  reset() {
    this.stage = 1;
    this.waveTarget = 0;
    this.isClear = false;
  }

  getWave() {
    return this.wave;
  }

  draw() {
    const y = 20 * this.scaleRatio;

    const fontSize = 20 * this.scaleRatio;
    this.ctx.font = `${fontSize}px serif`;
    this.ctx.fillStyle = "#525250";

    const stageX = 10 * this.scaleRatio;
    const timeX = stageX + 100 * this.scaleRatio;

    const stagePadded = this.wave.toString().padStart(2, 0);
    const timePadded = Math.floor(this.time).toString().padStart(2, 0);

    this.ctx.fillText(`Stage ${stagePadded}`, stageX, y);
    this.ctx.fillText(`Time ${timePadded}/${this.wave * 10}`, timeX, y);
  }
}
