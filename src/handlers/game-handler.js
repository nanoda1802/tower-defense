import { getGameAssets } from "../inits/assets.js";
import { rooms } from "../room/room.js";
import { TOWER_TYPE_PAWN } from "../constants.js";

/* Game Start 11 */
export const gameStart = (userId, payload) => {
  // [1] 게임 시작 시간 추출
  const startTime = payload.timestamp;
  // [2] 서버에서 해당 유저의 room 가져오기
  const room = rooms.find((room) => {
    return room.userId === userId;
  });
  // [3] 최초 웨이브 설정
  room.setWave(11, startTime);
  // [4] 최초 점수 설정
  room.setScore(0, 0, startTime);
  // [5] 최초 골드 설정
  const initGold = 100;
  room.setGold(initGold, 0, "start", startTime);
  // [6] 초기 HQ 체력 설정
  const initHp = 10;
  room.setHq(initHp, startTime);
  // [7] 초기 타워 설치
  const randomNum = Math.round(Math.random());
  const positionX = (Math.floor(Math.random() * 7) + 3) * 100;
  const positionY = randomNum === 0 ? 300 : 500;
  const towerType = TOWER_TYPE_PAWN;
  const towerData = getGameAssets().pawnTowers.data[randomNum];
  room.setTower(
    positionX,
    positionY,
    towerType,
    startTime,
    Object.assign({}, towerData),
    false,
    null,
    null,
  );
  // [8] 성공 응답 반환
  return {
    status: "success",
    message: "게임 시작!!",
    gold: initGold,
    initHp,
    positionX,
    positionY,
    type: towerType,
    data: towerData,
  };
};

/* Game End 12 */
export const gameEnd = (userId, payload) => {
  // [1] payload 구조 및 타입 검사
  if (
    !payload ||
    typeof payload.timestamp !== "number" ||
    typeof payload.score !== "number" ||
    typeof payload.leftGold !== "number" ||
    !["clear", "gameOver"].includes(payload.status) // 상태가 'clear' 또는 'gameOver'인지 확인
  ) {
    throw new Error("잘못된 payload 형식");
  }
  // [2] payload 정보 추출
  const { timestamp: endTime, score: cliScore, leftGold, status } = payload;
  // [3] 서버에서 최신 점수와 골드 데이터를 가져오기
  let roomIndex = 0;
  const room = rooms.find((room, idx) => {
    roomIndex = idx; // 해당 room을 찾은 시점의 인덱스 기록
    return room.userId === userId;
  });
  const serverScore = room.getScore().at(-1).totalScore || 0; // 최신 점수 가져오기
  const serverGold = room.getGold().at(-1).totalGold || 0; // 최신 골드 가져오기
  // [4] 클라이언트와 서버 점수 비교
  const tolerance = 50;
  if (Math.abs(serverScore - cliScore) > tolerance) {
    throw new Error(
      `점수 불일치: 클라이언트 점수(${cliScore})와 서버 점수(${serverScore})가 다릅니다. 차이: ${cliScore - serverScore}`,
    );
  }
  // [5] 클라이언트와 서버 골드 비교
  if (Math.abs(serverGold - leftGold) > tolerance) {
    throw new Error(
      `골드 불일치: 클라이언트 골드(${leftGold})와 서버 골드(${serverGold})가 다릅니다. 차이: ${serverGold - leftGold}`,
    );
  }
  // [6] 최종 점수 계산 및 응답 메세지 준비
  let finalScore = serverScore;
  let message = "";
  if (status === "clear") {
    finalScore += serverGold; // 게임 클리어 시 서버 골드와 클라이언트의 남은 골드를 더함
    message = `클리어로 추가 점수 ${serverGold}점을 얻어 최종 점수 ${finalScore}점 입니다!`;
  } else if (status === "gameOver") {
    finalScore; // 게임 오버 시 골드를 더하지 않음
    message = `게임오버로 최종 점수 ${finalScore}점 입니다!`;
  }
  // [7] 종료된 room 제거
  rooms.splice(roomIndex, 1);
  // [8] 최종 결과 응답
  return {
    status: "success",
    message,
    score: finalScore,
    details: {
      userId,
      finalScore,
      leftGold,
      gameEndTime: endTime,
      status, // 게임 상태도 결과에 포함
    },
  };
};

/* Game Save 13 */
export const gameSave = (userId, payload) => {
  //게임저장
  //현재 게임 상태를 저장하는 함수
};
/* Game Load 14 */
export const gameLoad = (userId, payload) => {
  //게임 불러오기
};
