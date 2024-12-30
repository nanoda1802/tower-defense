import { getGameAssets } from "../inits/assets.js";
import { setGold, clearGold, getGold } from "../models/gold-model.js";
import { clearWave } from "../models/wave-model.js";
import { clearTower, clearRemoveTower } from "../models/tower-model.js";
import { clearscore, getscore } from "../models/score-model.js";
import { clearHeadquater, setHeadquater } from "../models/headquater.model.js";
import { createAliveMonsters } from "../models/monster-model.js";
/* Game Start 11 */
//userId 사용자 고유의 아이디이다.
export const gameStart = (userId, payload) => {
  // 게임 시작 시 에셋 가져오기
  const { wave } = getGameAssets();
  // 해당 사용자의 이전 스테이지 정보 초기화
  clearWave(userId);
  // 첫 번째 스테이지(id: 1)로 설정하고 시작 시간 기록
  // setWave(userId, wave.data[0].id, payload.timestamp);
  // 골드 초기화
  clearGold(userId);
  // 초기 골드 설정 지금은 편의상 100으로 설정
  setGold(userId, 100, 0, "start", Date.now());
  const initGold = getGold(userId)[0].gold;
  //타워 초기화
  clearTower(userId);
  //제거 타워 초기화
  clearRemoveTower(userId);
  //초기 스코어 초기화
  clearscore(userId);
  //hQ 채력 초기화
  clearHeadquater(userId);
  //hQ 채력 100hp
  setHeadquater(userId, 100, payload.timestamp);
  //생존한 몬스터 초기화
  createAliveMonsters(userId);
  return { status: "success", message: "Game Started!!", gold: initGold };
};

/* Game End 12 */
export const gameEnd = (userId, payload) => {
  // payload 구조 및 타입 검사
  if (!payload || typeof payload.timestamp !== "number" || typeof payload.score !== "number" || typeof payload.leftGold !== "number") {
    throw new Error("잘못된 payload 형식");
  }

  const { timestamp: gameEndTime, score, leftGold } = payload;

  // 서버에서 최신 점수와 골드 데이터를 가져오기
  const scores = getscore(userId); // 서버에서 점수 데이터
  const gold = getGold(userId); // 서버에서 골드 데이터

  const serverScore = scores[scores.length - 1]?.sumScore || 0; // 최신 점수 가져오기
  const serverGold = gold[gold.length - 1]?.gold || 0; // 최신 골드 가져오기

  // 클라이언트와 서버 점수 비교
  if (serverScore !== score) {
    throw new Error(`점수 불일치: 클라이언트 점수(${score})와 서버 점수(${serverScore})가 다릅니다. 차이: ${score - serverScore}`);
  }

  // 클라이언트와 서버 골드 비교
  if (serverGold !== leftGold) {
    throw new Error(`골드 불일치: 클라이언트 골드(${leftGold})와 서버 골드(${serverGold})가 다릅니다. 차이: ${serverGold - leftGold}`);
  }

  // 최종 점수 계산
  const finalScore = serverScore + serverGold;

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
