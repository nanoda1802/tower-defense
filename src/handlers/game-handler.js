import { getGameAssets } from '../inits/assets.js';
import { setGold, clearGold, getGold } from '../models/gold-model.js';
import { clearWave, setWave } from '../models/wave-model.js';
import { setTower, clearTower, clearRemoveTower, getTower } from '../models/tower-model.js';
import { clearScore, getScore, setScore } from '../models/score-model.js';
import { clearHeadquarter, setHeadquarter, getHeadquarter } from '../models/headquarter.model.js';
import { clearAliveMonsters, clearDeathMonsters } from '../models/monster-model.js';
import { TOWER_TYPE_PAWN } from '../constants.js';
import redisClient from '../inits/redis.js'; // Redis 클라이언트 초기화
import { prisma } from '../inits/prisma.js';

// 사용자 ID를 기반으로 이메일을 가져오는 함수
export const getUserEmail = async (userId) => {
  try {
    // Prisma를 사용하여 MySQL에서 사용자 이메일 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }, // 이메일만 선택
    });

    // 사용자가 없거나 이메일이 없는 경우 예외 처리
    if (!user || !user.email) {
      throw new Error(`사용자 ID(${userId})에 해당하는 이메일을 찾을 수 없습니다.`);
    }

    return user.email;
  } catch (error) {
    console.error('사용자 이메일 조회 실패:', error.message);
    throw new Error('사용자 이메일을 가져오는 중 오류가 발생했습니다.');
  }
};

/* Game Start 11 */
//userId 사용자 고유의 아이디이다.
export const gameStart = (userId, payload) => {
  // [1] 웨이브 정보 초기화
  clearWave(userId);
  setWave(userId, 11, payload.timestamp);
  // [2] 골드 정보 초기화
  clearGold(userId);
  setGold(userId, 100, 0, 'start', payload.timestamp);
  const initGold = getGold(userId)[0].gold;
  // [3] 타워 초기화 및 초기 타워 설치
  clearTower(userId);
  clearRemoveTower(userId);
  const randomNum = Math.round(Math.random());
  const positionX = (Math.floor(Math.random() * 7) + 3) * 100;
  const positionY = randomNum === 0 ? 300 : 500;
  const towerType = TOWER_TYPE_PAWN;
  const towerData = getGameAssets().pawnTowers.data[randomNum];
  setTower(
    userId,
    positionX,
    positionY,
    towerType,
    payload.timestamp,
    Object.assign({}, towerData),
    false,
    null,
    null,
  );
  // [4] 스코어 초기화
  clearScore(userId);
  setScore(userId, 0, 0, payload.timestamp);
  // [5] hQ 체력 초기화
  clearHeadquarter(userId);
  setHeadquarter(userId, 10, payload.timestamp);
  const initHp = getHeadquarter(userId)[0].hp;
  // [6] 몬스터 초기화
  clearAliveMonsters(userId);
  clearDeathMonsters(userId);
  // [7] 성공 응답 반환
  return {
    status: 'success',
    message: 'Game Started!!',
    gold: initGold,
    initHp,
    positionX,
    positionY,
    type: towerType,
    data: towerData,
  };
};

let processedUsers = new Set(); // 이미 처리된 사용자 ID를 저장 -> gameEnd에서 사용중

/* Game End 12 */
export const gameEnd = async (userId, payload) => {
  if (processedUsers.has(userId)) {
    console.log(`이미 처리된 사용자 ID: ${userId}`);
    return { status: 'error', message: '이미 게임 종료 처리가 완료되었습니다.' };
  }
  // payload 구조 및 타입 검사
  if (
    !payload ||
    typeof payload.timestamp !== 'number' ||
    typeof payload.score !== 'number' ||
    typeof payload.leftGold !== 'number' ||
    !['clear', 'gameOver'].includes(payload.status) // 상태가 'clear' 또는 'gameOver'인지 확인
  ) {
    throw new Error('잘못된 payload 형식');
  }

  const { timestamp: gameEndTime, score, leftGold, status } = payload;

  // 서버에서 최신 점수와 골드 데이터를 가져오기
  const scores = getScore(userId); // 서버에서 점수 데이터
  const gold = getGold(userId); // 서버에서 골드 데이터

  const serverScore = scores[scores.length - 1].sumScore || 0; // 최신 점수 가져오기
  const serverGold = gold[gold.length - 1].gold || 0; // 최신 골드 가져오기
  const tolerance = 50;
  // 클라이언트와 서버 점수 비교
  if (Math.abs(serverScore - score) > tolerance) {
    throw new Error(
      `점수 불일치: 클라이언트 점수(${score})와 서버 점수(${serverScore})가 다릅니다. 차이: ${score - serverScore}`,
    );
  }

  // 클라이언트와 서버 골드 비교
  if (Math.abs(serverGold - leftGold) > tolerance) {
    throw new Error(
      `골드 불일치: 클라이언트 골드(${leftGold})와 서버 골드(${serverGold})가 다릅니다. 차이: ${serverGold - leftGold}`,
    );
  }

  let finalScore = serverScore;
  let message = '';
  if (status === 'clear') {
    finalScore += serverGold; // 게임 클리어 시 서버 골드와 클라이언트의 남은 골드를 더함
    message = `클리어로 추가 점수 ${serverGold}점을 얻어 최종 점수 ${finalScore}점 입니다!`;
  } else if (status === 'gameOver') {
    finalScore; // 게임 오버 시 골드를 더하지 않음
    message = `게임오버로 최종 점수 ${finalScore}점 입니다!`;
  }
  try {
    // Redis에 사용자 이메일과 최종 점수 저장
    const email = await getUserEmail(userId);

    // Redis에서 현재 사용자 점수를 조회
    const currentScore = await redisClient.zScore('leaderboard', email);

    if (!currentScore || finalScore > parseInt(currentScore, 10)) {
      // 새로운 점수가 기존 점수보다 높을 경우에만 업데이트
      await redisClient.zAdd('leaderboard', { score: finalScore, value: email });

      // 상위 순위만 유지 (10개 초과 시 하위 순위 제거)
      const totalRankings = await redisClient.zCard('leaderboard'); // 전체 랭킹 개수 확인
      if (totalRankings > 10) {
        await redisClient.zRemRangeByRank('leaderboard', -1, -(totalRankings - 10));
      }

      console.log(`스코어 보드 업데이트 완료: ${email} - ${finalScore}`);
    } else {
      console.log(`기존 점수가 더 높거나 동일합니다. 업데이트 생략: ${email} - ${currentScore}`);
    }

    processedUsers.add(userId); // 사용자 ID를 처리된 목록에 추가

    return {
      status: 'success',
      message,
      score: finalScore,
      details: {
        userId,
        email,
        finalScore,
        leftGold,
        gameEndTime,
        status, // 게임 상태도 결과에 포함
      },
    };
  } catch (err) {
    console.error('Redis 또는 이메일 조회 실패:', err);
    throw new Error('스코어 보드 업데이트 중 오류가 발생했습니다.');
  }
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
