export class Monster {
  constructor(path, monsterImages, level, speed) {
    // 생성자 안에서 몬스터의 속성을 정의한다고 생각하시면 됩니다!
    if (!path || path.length <= 0) {
      throw new Error("몬스터가 이동할 경로가 필요합니다.");
    }
    this.monsterNumber = Math.floor(Math.random() * monsterImages.length); // 몬스터 번호 (1 ~ 5. 몬스터를 추가해도 숫자가 자동으로 매겨집니다!)
    this.path = path; // 몬스터가 이동할 경로
    this.currentIndex = 0; // 몬스터가 이동 중인 경로의 인덱스
    this.x = path[0].x; // 몬스터의 x 좌표 (최초 위치는 경로의 첫 번째 지점)
    this.y = path[0].y; // 몬스터의 y 좌표 (최초 위치는 경로의 첫 번째 지점)
    this.width = 80; // 몬스터 이미지 가로 길이
    this.height = 80; // 몬스터 이미지 세로 길이
    this.speed = speed; // 몬스터의 이동 속도
    this.image = monsterImages[this.monsterNumber]; // 몬스터 이미지
    this.level = level; // 몬스터 레벨
    this.init(level);
  }

  init(level) {
    this.maxHp = 100 + 10 * level; // 몬스터의 현재 HP
    this.hp = this.maxHp; // 몬스터의 현재 HP
    this.attackPower = 10 + 1 * level; // 몬스터의 공격력 (기지에 가해지는 데미지)
  }

  move() {
    this.x += this.speed;
  }

  collideWith(base) {
    const isDestroyed = base.takeDamage(this.attackPower);
    this.hp;
    return isDestroyed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(
      `(레벨 ${this.level}) ${this.hp}/${this.maxHp}`,
      this.x,
      this.y - 5,
    );
  }
}
