// const golds = {};
const golds = {
  tester: [
    { id: 1001, gold: 1000, changeGold: 0, desc: 'START' },
    { id: 1001, gold: 1000, changeGold: 0, desc: 'START' },
  ],
};

//스테이지 초기화
export const createGold = (userId) => {
  golds[userId] = [];
};

export const getGold = (userId) => {
  return golds[userId];
};
export const setGold = (userId, sumGold, changeGold, desc, timestamp) => {
  /***
   * sumGold    총 보유 골드
   * changeGold 증감치
   * desc       분류 [START,PURCHASE,UPGRADE,SELL,KILL]
   */
  return golds[userId].push({ gold: sumGold, changeGold, desc, timestamp });
};

export const clearGold = (userId) => {
  golds[userId] = [];
};
