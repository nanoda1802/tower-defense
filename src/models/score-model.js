const score = {};

//스테이지 초기화
export const createscore = (userId) => {
  score[userId] = [];
};

export const getscore = (userId) => {
  return score[userId];
};

export const setscore = (userId, score) => {
  return score[userId].push({ score });
};

export const clearscore = (userId) => {
  score[userId] = [];
};
