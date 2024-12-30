const score = {};

//스테이지 초기화
export const createScore = (userId) => {
  score[userId] = [];
};

export const getScore = (userId) => {
  return score[userId];
};

export const setScore = (userId, sumScore, changeScore, timestamp) => {
  return score[userId].push({ userId, sumScore, changeScore, timestamp });
};

export const clearScore = (userId) => {
  score[userId] = [];
};
