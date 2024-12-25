import { getGameAssets } from "../inits/assets.js";
import { setGold, clearGold } from "../models/gold-model.js";
import { setWave, clearWave } from "../models/wave-model.js";
import { clearTower } from "../models/tower-model.js";
/* Game Start 11 */
//uuid 사용자 고유의 아이디이다. 이걸 redis에서 저장된 db에서 가져와야 한다.
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
  setGold(userId, 0, 100, "INITIAL");
  // sumGold: 0, changeGold: 100, desc: "INITIAL"
  //타워 초기화
  clearTower(userId);
  //제거 타워 초기화
  clearRemoveTower(userId);
  //초기 스코어 초기화
  clearscore(userId);
};

/* Game End 12 */
export const gameEnd = (userId, payload) => {
  const { bosses, monsters, wave } = getGameAssets();
  //payload이것과 몬스터 id와 처치수(이걸 객체로 받고), 웨이브 전체 처리 여부를 넘겨줘야 함. 남은 골드의 량
  /*score 클라이언트에서 처리된 스코어,
   leftGold 남은 골드의 량
  */
  const { timestamp: gameEndTime, score, leftGold } = payload;

  saveGameEndTime(userId, gameEndTime); // 게임 종료 시간을 저장하는 함수 호출

  //이게 서버에서 계산된 스코어
  let serverScore = 0;
  // 스코어 계산
  let monsterKillScore = 0;
  let bossKillScore = 0;
  let allKillScore = 0;
  let leftGoldScore = 0;
  // 몬스터 처치 수 계산
  const monsterKill = getAliveMonsters();
  //boss kill도 마찬가지
  const bossKill = getAliveBosses();

  //monsterkill은 객체로 어떤 monsterid가 몇마리 죽었는지가 나온다.  이걸 monster.json에서 가져와야 한다
  for (const [monsterId, kill] of monsterKill) {
    const monster = monsters.data.find((m) => m.id === monsterId);
    if (!monster) {
      console.error("몬스터 찾기 실패");
      continue;
    }
    monsterKillScore += monster.score * kill;
  }

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

  //bosskill도 마찬가지
  for (const [bossId, kill] of bossKill) {
    const boss = bosses.data.find((b) => b.id === bossId);
    if (!boss) {
      console.error("보스 찾기 실패");
      continue;
    }
    bossKillScore += boss.score * kill;
  }

  // 남은 골드 계산
  leftGoldScore = leftGold;
  // 스코어 계산
  serverScore = monsterKillScore + bossKillScore + allKillScore + leftGoldScore;

  //여기서 나온 스코어가 위의 받아온 클라이언트 스코어가 같은지 확인
  if (serverScore !== score) {
    console.error("스코어 계산 오류");
    return;
  }

  //스코어 저장 완료
};

/* Game Save 13 */
export const gameSave = () => {};
/* Game Load 14 */
export const gameLoad = () => {};
