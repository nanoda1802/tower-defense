import { monsterTable } from './game.js';

/* monsterHealth, monsterAttack, monsterSpeed, monsterGold, monsterScore, */

export class Monster {
  isEventProcessing = false;
  constructor(path, monsterImage, id, maxHp, attack, speed, gold, score, wave, index) {
    if (!path || path.length <= 0) {
      throw new Error('몬스터가 이동할 경로가 필요합니다.');
    }
    this.id = id;
    this.path = path; // 몬스터가 이동할 경로
    this.currentPath = 0; // 몬스터가 이동 중인 경로의 인덱스
    this.x = path[0].x; // 몬스터의 x 좌표 (최초 위치는 경로의 첫 번째 지점)
    this.y = id >= 200 ? path[0].y - 70 : path[0].y; // 몬스터의 y 좌표 (최초 위치는 경로의 첫 번째 지점)
    this.width = id >= 200 ? 150 : 80; // 몬스터 이미지 가로 길이
    this.height = id >= 200 ? 150 : 80; // 몬스터 이미지 세로 길이
    this.speed = speed; // 몬스터의 이동 속도
    this.image = monsterImage; // 몬스터 이미지
    this.maxHp = maxHp; // 몬스터의 최대 HP
    this.currentHp = this.maxHp; // 몬스터의 현재 HP
    this.attackPower = attack;
    this.gold = gold;
    this.score = score;
    this.wave = wave;
    this.index = index;
  }

  move(deltatime) {
    this.x += this.speed * deltatime;
  }

  collideWith(base) {
    const isDestroyed = base.takeDamage(this.attackPower);
    return isDestroyed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'Black';
    ctx.fillText(`(Wave ${this.wave}) ${this.currentHp}/${this.maxHp}`, this.x, this.y - 5);
  }
}
