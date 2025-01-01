export const rooms = [];

export class Room {
  hq = [];
  score = [];
  gold = [];
  wave = [];
  aliveMonsters = [];
  deathMonsters = [];
  towers = [];
  offTowers = [];
  constructor(key, userId) {
    this.key = key;
    this.userId = userId; // [userId01, userId02,...]가 목표지만 일단 싱글 기준
  }
  /* HQ 관련 메서드 */
  getHq() {
    return this.hq;
  }
  setHq(currentHp, timestamp) {
    return this.hq.push({ currentHp, timestamp });
  }

  /* Score 관련 메서드 */
  getScore() {
    return this.score;
  }
  setScore(totalScore, changeScore, timestamp) {
    return this.score.push({ totalScore, changeScore, timestamp });
  }

  /* Gold 관련 메서드 */
  getGold() {
    return this.gold;
  }
  setGold(totalGold, changeGold, description, timestamp) {
    return this.gold.push({ totalGold, changeGold, description, timestamp });
  }

  /* Wave 관련 메서드 */
  getWave() {
    return this.wave;
  }
  setWave(waveId, timestamp) {
    return this.wave.push({ waveId, timestamp });
  }

  /* Monsters 관련 메서드 */
  getAliveMonsters() {
    return this.aliveMonsters;
  }
  setAliveMonsters(
    timestamp,
    monsterId,
    monsterIndex,
    monsterHealth,
    monsterAttack,
    monsterSpeed,
    monsterGold,
    monsterScore,
  ) {
    return this.aliveMonsters.push({
      timestamp,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
    });
  }
  removeAliveMonsters(monsterId, monsterIndex) {
    const targetIndex = this.aliveMonsters.findIndex(
      (monster) =>
        monster.monsterId === monsterId &&
        monster.monsterIndex === monsterIndex,
    );
    if (targetIndex !== -1) {
      this.aliveMonsters.splice(targetIndex, 1);
    }
  }

  getDeathMonsters() {
    return this.deathMonsters;
  }
  setDeathMonsters(
    timestamp,
    monsterId,
    monsterIndex,
    monsterHealth,
    monsterGold,
    monsterScore,
  ) {
    return this.deathMonsters.push({
      timestamp,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterGold,
      monsterScore,
    });
  }

  /* Tower 관련 메서드 */
  getTowers() {
    return this.towers;
  }
  setTower(
    positionX,
    positionY,
    type,
    timestamp,
    data,
    isGetBuff,
    buffTowerPos,
    buffTarget,
  ) {
    return this.towers.push({
      positionX,
      positionY,
      type,
      timestamp,
      data,
      isGetBuff,
      buffTowerPos,
      buffTarget,
    });
  }
  removeTower(towerId, positionX, positionY, timestamp) {
    const targetIndex = this.towers.findIndex(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY,
    );
    if (targetIndex !== -1) {
      this.offTowers.push(this.towers[targetIndex], timestamp);
      return this.towers.splice(targetIndex, 1)[0];
    }
  }
  upgradeTower(towerId, positionX, positionY) {
    const targetIndex = this.towers.findIndex(
      (tower) =>
        tower.data.id === towerId &&
        tower.positionX === positionX &&
        tower.positionY === positionY,
    );
    if (targetIndex !== -1) {
      this.towers[targetIndex].data.card =
        Number(this.towers[targetIndex].data.card) + 1 + "";
      this.towers[targetIndex].data.attack =
        this.towers[targetIndex].data.attack + 1;
      this.towers[targetIndex].data.attack_speed =
        this.towers[targetIndex].data.attack_speed + 1;
      this.towers[targetIndex].data.range =
        this.towers[targetIndex].data.range + 1;
    }
  }

  getOffTowers() {
    return this.offTowers;
  }
}
