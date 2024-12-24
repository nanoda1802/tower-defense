const golds = {};

//스테이지 초기화
export const createGold = (userId) => {
  golds[userId] = [];
};

export const getGold = (userId) => {
  return golds[userId];
};
export const setGold = (userId, sumGold, changeGold, desc) => {
  /***
   * sumGold    총 보유 골드
   * changeGold 증감치
   * desc       분류 [PURCHASE,SELL,KILL]
   */
  return golds[userId].push({ sumGold, changeGold, desc });
};

export const clearGold = (userId) => {
  golds[userId] = [];
};
