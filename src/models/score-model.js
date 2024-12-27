const score = {};

//스테이지 초기화
export const createscore = (userId) => {
  score[userId] = [];
};

export const getscore = (userId) => {
  return score[userId];
};

export const setscore = (userId, sumScore, changeScore, timestamp) => {
  return score[userId].push({ userId, sumScore, changeScore, timestamp });
};

export const clearscore = (userId) => {
  score[userId] = [];
};
