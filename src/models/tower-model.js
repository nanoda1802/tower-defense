const towers = {};

//스테이지 초기화
export const createTower = (userId) => {
  towers[userId] = [];
};

export const getTower = (userId) => {
  return towers[userId];
};

export const setTower = (userId, towerId, positionX, positionY) => {
  return towers[userId].push({ towerId, positionX, positionY });
};

export const clearTower = (userId) => {
  towers[userId] = [];
};

export const removeTower = (userId, towerId, positionX, positionY) => {
  const index = towers[userId].findIndex((tower) => tower.towerId === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    return towers[userId].splice(index, 1)[0];
  }
};
