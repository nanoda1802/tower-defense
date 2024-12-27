const score = {};

//스테이지 초기화
export const createscore = (userId) => {
  score[userId] = [];
};

export const getscore = (userId) => {
  return score[userId];
};

export const setscore = (userId, sumscore, score, timestamp ) => {
  return score[userId].push({ userId, sumscore, changeScore, timestamp });
};

export const clearscore = (userId) => {
  score[userId] = [];
};
