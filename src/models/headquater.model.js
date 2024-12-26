const headquaters = {};

//스테이지 초기화
export const createHeadquater = (userId) => {
  headquaters[userId] = [];
};

export const getHeadquater = (userId) => {
  return headquaters[userId];
};

export const setHeadquater = (userId, hp, timestamp) => {
  return headquaters[userId].push({ hp, timestamp });
};

export const clearHeadquater = (userId) => {
  headquaters[userId] = [];
};
