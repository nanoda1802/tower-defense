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

export const clearTower = (uuuserIdid) => {
  towers[userId] = [];
};
