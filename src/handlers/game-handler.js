import { setGold, clearGold, getGold } from "../models/gold-model.js";
import { clearWave, setWave } from "../models/wave-model.js";
import { clearTower, clearRemoveTower } from "../models/tower-model.js";
import { clearScore, getScore, setScore } from "../models/score-model.js";
import { clearHeadquarter, setHeadquarter, getHeadquarter } from "../models/headquarter.model.js";
import { clearAliveMonsters, clearDeathMonsters } from "../models/monster-model.js";
/* Game Start 11 */
//userId 사용자 고유의 아이디이다.
export const gameStart = (userId, payload) => {
  // [1] 웨이브 정보 초기화
  clearWave(userId);
  setWave(userId, 11, payload.timestamp);
  // [2] 골드 정보 초기화
  clearGold(userId);
  setGold(userId, 100, 0, "start", payload.timestamp);
  const initGold = getGold(userId)[0].gold;
  // [3] 타워 초기화
  clearTower(userId);
  clearRemoveTower(userId);
  // [4] 스코어 초기화
  clearScore(userId);
  setScore(userId, 0, 0, payload.timestamp);
  // [5] hQ 채력 초기화
  clearHeadquarter(userId);
  setHeadquarter(userId, 10, payload.timestamp);
  const initHp = getHeadquarter(userId)[0].hp;
  // [6] 몬스터 초기화
  clearAliveMonsters(userId);
  clearDeathMonsters(userId);
  // [7] 성공 응답 반환
  return {
    status: "success",
    message: "Game Started!!",
    gold: initGold,
    initHp,
  };
};

/* Game End 12 */
export const gameEnd = (userId, payload) => {
  // payload 구조 및 타입 검사
  if (
    !payload ||
    typeof payload.timestamp !== "number" ||
    typeof payload.score !== "number" ||
    typeof payload.leftGold !== "number" ||
    !["clear", "gameOver"].includes(payload.status) // 상태가 'clear' 또는 'gameOver'인지 확인
  ) {
    throw new Error("잘못된 payload 형식");
  }

  const { timestamp: gameEndTime, score, leftGold, status } = payload;

  // 서버에서 최신 점수와 골드 데이터를 가져오기
  const scores = getScore(userId); // 서버에서 점수 데이터
  const gold = getGold(userId); // 서버에서 골드 데이터

  const serverScore = scores[scores.length - 1].sumScore || 0; // 최신 점수 가져오기
  const serverGold = gold[gold.length - 1].gold || 0; // 최신 골드 가져오기

  // 클라이언트와 서버 점수 비교
  if (serverScore !== score) {
    throw new Error(`점수 불일치: 클라이언트 점수(${score})와 서버 점수(${serverScore})가 다릅니다. 차이: ${score - serverScore}`);
  }

  // 클라이언트와 서버 골드 비교
  if (serverGold !== leftGold) {
    throw new Error(`골드 불일치: 클라이언트 골드(${leftGold})와 서버 골드(${serverGold})가 다릅니다. 차이: ${serverGold - leftGold}`);
  }

  let finalScore = serverScore;

  if (status === "clear") {
    finalScore += serverGold; // 게임 클리어 시 서버 골드와 클라이언트의 남은 골드를 더함
  } else if (status === "gameOver") {
    finalScore; // 게임 오버 시 골드를 더하지 않음
  }

  // 최종 결과 반환
  return {
    status: "success",
    message: "게임이 성공적으로 종료되었습니다.",
    score: finalScore,
    details: {
      userId,
      finalScore,
      leftGold,
      gameEndTime,
      status, // 게임 상태도 결과에 포함
    },
  };
};
