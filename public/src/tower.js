export class Tower {
  constructor(x, y, cost, towerImage, id, type) {
    this.id = id;
    this.type = type;
    // 생성자 안에서 타워들의 속성을 정의한다고 생각하시면 됩니다!
    this.x = x; // 타워 이미지 x 좌표
    this.y = y; // 타워 이미지 y 좌표
    this.image = towerImage;
    this.width = 100; // 타워 이미지 가로 길이 (이미지 파일 길이에 따라 변경 필요하며 세로 길이와 비율을 맞춰주셔야 합니다!)
    this.height = 100; // 타워 이미지 세로 길이
    this.attackPower = 40; // 타워 공격력
    this.range = 300; // 타워 사거리
    this.cost = cost; // 타워 구입 비용
    this.attackInterval = 0; // 타워 공격 쿨타임
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
    // sendEvent(44, {});
    if (this.attackInterval <= 0) {
      monster.currentHp -= this.attackPower;
      this.attackInterval = 180; // 3초 쿨타임 (초당 60프레임)
      this.beamDuration = 30; // 광선 지속 시간 (0.5초)
      this.target = monster; // 광선의 목표 설정
    }
    if (monster.currentHp <= 0) {
      return { gold: 10, score: 10 }; // res에서 처치 골드랑 점수 받기
    }
    return { gold: 0, score: 0 };
  }

  updateAttackInterval() {
    if (this.attackInterval > 0) {
      this.attackInterval--;
    }
  }
}
