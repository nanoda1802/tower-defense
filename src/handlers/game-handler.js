import { getGameAssets } from "../inits/assets.js";
import { setGold, clearGold, getGold } from "../models/gold-model.js";
import { clearWave } from "../models/wave-model.js";
import { clearTower, clearRemoveTower } from "../models/tower-model.js";
import { getDeathMonsters, getDeathBosses } from "../models/monster-model.js";
import { clearscore } from "../models/score-model.js";
import { clearHeadquater, setHeadquater } from "../models/headquater.model.js";

/* Game Start 11 */
//userId 사용자 고유의 아이디이다.
export const gameStart = (userId, payload) => {
  // 게임 시작 시 에셋 가져오기
  const { wave } = getGameAssets();
  // 해당 사용자의 이전 스테이지 정보 초기화
  clearWave(userId);
  // 첫 번째 스테이지(id: 1)로 설정하고 시작 시간 기록
  setWave(userId, wave.data[0].id, payload.timestamp);
  //골드 초기화
  clearGold(userId);
  // 초기 골드 설정 지금은 편의상 100으로 설정
  setGold(userId, 0, 100, "INITIAL", payload.timestamp);
  // sumGold: 0, changeGold: 100, desc: "INITIAL(초기값)"
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

  const { bosses, monsters, wave } = getGameAssets();

  //이게 서버에서 계산된 스코어
  let serverScore = 0;
  // 스코어 계산
  let monsterKillScore = 0;
  let bossKillScore = 0;
  let allKillScore = 0;
  let leftGoldScore = 0;
  // 몬스터 처치 수 계산
  const monsterKill = getDeathMonsters();
  //boss kill도 마찬가지
  const bossKill = getDeathBosses();

  //monsterkill은 객체로 어떤 monsterid가 몇마리 죽었는지가 나온다. 이걸 monster.json에서 가져와야 한다
  for (const [monsterId, kill] of monsterKill) {
    const monster = monsters.data.find((m) => m.id === monsterId);
    if (!monster) {
      console.error("몬스터 찾기 실패");
      continue;
    }
    monsterKillScore += monster.score * kill;
  }
  console.log(monsterKillScore);
  /* 일단 monsterkill에 있는 monster id와 처치수를 받아온다 그다음 wave.json에서 몬스토 id와 monster_cnt 가져온다 
     그리고 그 몬스터의 수가 같으면 all_kill_score를 더한다.*/

  for (const [monsterId, kill] of monsterKill) {
    const waveData = wave.data.find((w) => w.monster_id === monsterId); // wave.json에서 monster_id와 일치하는 항목 찾기
    if (!waveData) {
      console.error("웨이브 데이터 찾기 실패");
      continue;
    }

    if (kill === waveData.monster_cnt) {
      // kill과 monster_cnt 비교
      allKillScore += waveData.all_kill_score; // all_kill_score 추가
    }
  }
  console.log(allKillScore);

  //bosskill도 마찬가지
  for (const [bossId, kill] of bossKill) {
    const boss = bosses.data.find((b) => b.id === bossId);
    if (!boss) {
      console.error("보스 찾기 실패");
      continue;
    }
    bossKillScore += boss.score * kill;
  }
  console.log(bossKillScore);
  // 남은 골드 계산

  // 클라이언트에서 가져온 골드와 서버에서 계산된 골드 비교
  const clientGold = getGold(userId); // 클라이언트에서 가져온 골드
  if (clientGold !== leftGoldScore) {
    console.error(
      `클라이언트 골드 ${clientGold}와 서버 골드 ${leftGoldScore}가 다릅니다. ${clientGold - leftGoldScore} 차이가 납니다.`,
    );
    return;
  }

  leftGoldScore = leftGold;

  console.log(leftGoldScore);
  // 스코어 계산
  serverScore = monsterKillScore + bossKillScore + allKillScore + leftGoldScore;

  //여기서 나온 스코어가 위의 받아온 클라이언트 스코어가 같은지 확인
  if (serverScore !== score) {
    console.error(
      `클라이언트 점수 ${score}와 서버 점수 ${serverScore}가 다릅니다. ${score - serverScore} 차이가 납니다.`,
    );
    return;
  }

  // 모든 검증이 끝났으면 userid와 스코어와 leftGold 저장 db에 저장하고 싶은데 아직 어떻게 저장해야 된다 redis로 저장.
  return {
    status: "success",
    message: "게임이 성공적으로 종료되었습니다",
    score: serverScore,
    details: {
      userId,
      serverScore,
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
