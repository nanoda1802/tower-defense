export class Tower {
  isBuff = false;
  isBuffed = false;
  constructor(
    x,
    y,
    towerImage,
    id,
    type,
    attack,
    attackSpeed,
    range,
    buffTarget,
    isGetBuff,
    buffTowerPos,
  ) {
    this.id = id;
    this.type = type; // 일반 : pawn , 특수 : special
    this.x = x; // 타워 이미지 x 좌표
    this.y = y; // 타워 이미지 y 좌표
    this.image = towerImage;
    this.width = 100; // 타워 이미지 가로 길이 (이미지 파일 길이에 따라 변경 필요하며 세로 길이와 비율을 맞춰주셔야 합니다!)
    this.height = 100; // 타워 이미지 세로 길이
    this.attackPower = attack; // 타워 공격력
    this.range = range; // 타워 사거리
    this.attackInterval = 0; // 타워 공격 쿨타임
    this.attackSpeed = attackSpeed;
    this.beamDuration = 0; // 타워 광선 지속 시간
    this.target = null; // 타워 광선의 목표
    this.buffTarget = null;
    this.isGetBuff = false;
    this.buffTowerPos = null;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    if (this.beamDuration > 0 && this.target) {
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.lineTo(
        this.target.x + this.target.width / 2,
        this.target.y + this.target.height / 2,
      );
      ctx.strokeStyle = this.isBuff ? "red" : "skyblue";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
      this.isBuff ? 0 : this.beamDuration--;
    }
  }

  attack(monster) {
    if (this.attackInterval <= 0) {
      monster.currentHp -= this.attackPower;
      this.attackInterval = 180; // 3초 쿨타임 (초당 60프레임)
      this.beamDuration = 30; // 광선 지속 시간 (0.5초)
      this.target = monster; // 광선의 목표 설정
    }
  }

  buffStatus(buffValue, color, isBuff, buffTowerPos) {
    console.log(
      "color : ",
      color,
      "this.attackSpeed : ",
      this.attackSpeed,
      buffValue,
    );
    if (color === "black") {
      // 공격
      if (isBuff) {
        this.attackPower += buffValue;
        this.isGetBuff = true;
      } else {
        this.attackPower -= buffValue;
        this.isGetBuff = false;
      }
    } else {
      //공속
      if (isBuff) {
        this.attackSpeed += buffValue;
        this.isGetBuff = true;
      } else {
        this.attackSpeed -= buffValue;
        this.isGetBuff = false;
      }
    }

    this.buffTowerPos = buffTowerPos;
    console.log("this.attackSpeed : ", this.attackSpeed);
  }

  updateAttackInterval() {
    if (this.attackInterval > 0) {
      this.attackInterval -= this.attackSpeed;
    }
  }

  updateBuffTowers(buffTarget, updateBuffTowers) {
    this.buffTarget = buffTarget; //버프 타워의 버프 대상 타워 정보

    // 빔 그리기
    this.target = updateBuffTowers;
    // this.attackInterval = 180; // 3초 쿨타임 (초당 60프레임)
    this.beamDuration = 30; // 광선 지속 시간 (0.5초)
    this.isBuff = true;
  }
}
