import { getGameAssets } from "../inits/assets.js";
import { setGold, clearGold, getGold } from "../models/gold-model.js";
import { clearWave } from "../models/wave-model.js";
import { clearTower, clearRemoveTower } from "../models/tower-model.js";
import { getDeathMonsters} from "../models/monster-model.js";
import { clearscore, getscore } from "../models/score-model.js";
import { clearHeadquater, setHeadquater } from "../models/headquater.model.js";
import {
  createAliveMonsters,
  createDeathMonsters
} from "../models/monster-model.js";
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
  //죽은 몬스터 초기화
  createDeathMonsters(userId);
  //생존한 보스 초기화
  // createAliveBosses(userId);
  //죽은 보스 초기화
  // createDeathBosses(userId);
  return { status: "success", message: "Game Started!!", gold: initGold };
};

/* Game End 12 */
export const gameEnd = (userId, payload) => {
  //payload
  /*  timestamp: 게임 종료 시간, 
  score: 클라이언트에서 처리된 스코어,
  leftGold: 남은 골드의 량
  */
  const { timestamp: gameEndTime, score, leftGold } = payload;

  // payload 타입 검사
  if (
    typeof payload.timestamp !== "number" ||
    typeof payload.score !== "number" ||
    typeof payload.leftGold !== "number"
  ) {
    throw new Error("잘못된 payload 형식");
  }

  //get score로 최신의 점수를 가져오고 이걸 score랑 비교를 하면 됬다.
  const scores = getscore(userId); // 서버에서의 score를 가져온다.

  const serverScore = scores[scores.length - 1]?.sumScore || 0; // 최신 스코어가 없으면 0 반환

  //이제 이걸 클라이언트에서 가져온 score랑 비교를 해야된다.
  if (serverScore !== score) {
    console.error(
      `클라이언트 점수 ${score}와 서버 점수 ${serverScore}가 다릅니다. ${score - serverScore} 차이가 납니다.`,
    );
    return;
  }
  console.log(`serverScore: ${serverScore} clientScore: ${score}`);

  // 남은 골드 계산
  const gold = getGold(userId); // 클라이언트에서 가져온 골드

  const serverGold = gold[gold.length - 1]?.gold || 0; // 최신 골드가 없으면 0 반환

  //이걸 left gold하고 비교
  if (serverGold !== leftGold) {
    console.error(
      `클라이언트 골드 ${leftGold}와 서버 골드 ${serverGold}가 다릅니다. ${serverGold - leftGold} 차이가 납니다.`,
    );
    return;
  }

  // 모든 검증이 끝났으면 골드와 스코어를 더해주고 반환
  let finalScore = serverScore + score;
  console.log("finalScore", finalScore);

  // 모든 검증이 끝났으면 userid와 스코어와 leftGold 저장 db에 저장하고 싶은데 아직 어떻게 저장해야 된다 redis로 저장.
  return {
    status: "success",
    message: "게임이 성공적으로 종료되었습니다",
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
