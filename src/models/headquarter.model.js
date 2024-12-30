const headquarters = {};

//스테이지 초기화
export const createHeadquarter = (userId) => {
  headquarters[userId] = [];
};

export const getHeadquarter = (userId) => {
  return headquarters[userId];
};

export const setHeadquarter = (userId, hp, timestamp) => {
  return headquarters[userId].push({ hp, timestamp });
};

export const clearHeadquarter = (userId) => {
  headquarters[userId] = [];
};
