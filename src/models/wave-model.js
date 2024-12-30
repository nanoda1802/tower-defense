/* 사용자별 웨이브 정보 관리 */
// { userId : [ 웨이브 정보 ]} 형태의 객체
const waves = {};

// 신규 사용자의 웨이브 초기화
export const createWave = (userId) => {
  waves[userId] = []; // 빈 배열 투입!
};

// 특정 사용자의 웨이브 정보 조회
export const getWave = (userId) => {
  return waves[userId]; // userId를 통해 사용자 식별
};

// 사용자 웨이브 정보 업데이트
export const setWave = (userId, waveId, timestamp) => {
  // userId로 사용자 식별해 어느 단계인지 알려주는 id와 그 단계에 진입한 timestamp 투입!
  return waves[userId].push({ waveId, timestamp });
};

// ?? createStage랑 정확히 동일한 역할을 하는데, 둘이 별개일 이유가 있을까??
export const clearWave = (userId) => {
  waves[userId] = [];
};
