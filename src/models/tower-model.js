const towers = {};
const removeTowers = {};

//스테이지 초기화
export const createTower = (userId) => {
  towers[userId] = [];
};

export const getTower = (userId) => {
  return towers[userId];
};

export const setTower = (userId, positionX, positionY, type, timestamp, data) => {
  return towers[userId].push({ userId, positionX, positionY, type, timestamp, data });
};

export const clearTower = (userId) => {
  towers[userId] = [];
};

export const clearRemoveTower = (userId) => {
  removeTowers[userId] = [];
};

export const removeTower = (userId, towerId, positionX, positionY, timestamp) => {
  const index = towers[userId].findIndex((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    removeTowers[userId].push(towers[userId][index], timestamp);
    return towers[userId].splice(index, 1)[0];
  }
};

export const upgradeTower = (userId, towerId, positionX, positionY) => {
  const index = towers[userId].findIndex((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    towers[userId][index].data.card = Number(towers[userId][index].data.card) + 1 + '';
    towers[userId][index].data.attack = towers[userId][index].data.attack + 1;
    towers[userId][index].data.attack_speed = towers[userId][index].data.attack_speed + 0.2;
    towers[userId][index].data.range = towers[userId][index].data.range + 0.1;
  }
};

export const getRemoveTower = (userId) => {
  return removeTowers[userId];
};
