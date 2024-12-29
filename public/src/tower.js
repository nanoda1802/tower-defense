export class Tower {
  constructor(x, y, towerImage, id, type, attack, attackSpeed, range) {
    this.id = id;
    this.type = type;
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
      ctx.strokeStyle = "skyblue";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.closePath();
      this.beamDuration--;
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

  updateAttackInterval() {
    if (this.attackInterval > 0) {
      this.attackInterval -= this.attackSpeed;
    }
  }
}
