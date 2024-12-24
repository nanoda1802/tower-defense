// const towers = {};
const towers = { tester: [{ id: 1001, card: 1, color: 'red', positionX: 0, positionY: 0 }] };

//스테이지 초기화
export const createTower = (userId) => {
  towers[userId] = [];
};

export const getTower = (userId) => {
  return towers[userId];
};

export const setTower = (userId, towerId, card, color, positionX, positionY) => {
  return towers[userId].push({ towerId, card, color, positionX, positionY });
};

export const clearTower = (userId) => {
  towers[userId] = [];
};

export const removeTower = (userId, towerId, positionX, positionY) => {
  const index = towers[userId].findIndex((tower) => tower.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    return towers[userId].splice(index, 1)[0];
  }
};

export const upgradeTower = (userId, towerId, positionX, positionY) => {
  const index = towers[userId].findIndex((tower) => tower.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    return (towers[userId][index].card = towers[userId][index].card + 1);
  }
};
