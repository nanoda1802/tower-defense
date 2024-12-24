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
   monsterKill 몬스터 id와 처치수 객체 형태,
   isAllkill 웨이브 id와 했냐 안했내의 여부 객체형태,
   bosskill은 보스 id만 
   leftGold 남은 골드의 량
  */
  const { timestamp: gameEndTime, score, leftGold } = payload;
  /*
  여기서
  이것들을 전부다 받으면 검증도 많아 지기 떄문에 몇개는 그냥 실시간으로 받고 저장해야할것같다.
  그중 하나가 몬스터 처치수와,보스 처지 이것들은 실시간으로 서버에서 관리하는것이 맞는것 같기도 하다.  
  */

  /* monsterkill,bosskill,isAllkill
   이세개도 검증을 해야한다.
   monsterkill은 몬스터 id가 있는지 검증
   bosskill은 보스 id가 있는지 검증
   isAllkill은 웨이브 id가 있는지 검증
   지금 wave.json 파일에는 어떤 몬스터 id가 몇마리 나왔는지 적혀져 있다.
   그리고 한 웨이브에는 한종류의 몬스터만 나온데
   근데 monsterkill에 wave의 "monster_cnt": 20  되어 있는지 만약 20보다 많으면 오류를 뱉어야 한다.
  그리고 만약 저런 경우 monsterkill에 19마리 잡았다고 되어 있는되 isAllkill에 웨이브 id가 1이고 isAllkill이 True라고 되어 있으면 오류를 뱉어야 한다.
  boss는 죽이지 못하면 게임 오버이다.
  그리고 웨이브 3의 보스를 죽였는데 웨이브 4의 보스나,몬스터가 죽으면 오류를 뱉어야한다.  
  */

  //이게 서버에서 계산된 스코어
  let serverScore = 0;
  // 스코어 계산
  let monsterKillScore = 0;
  let bossKillScore = 0;
  let allKillScore = 0;
  let leftGoldScore = 0;
  // 몬스터 처치 수 계산
  for (const [monsterid, kill] of monsterKill) {
    const monster = monsters.data.find((m) => m.id === monsterid);
    if (!monster) {
      console.error("몬스터 찾기 실패");
      continue;
    }
    monsterKillScore += monster.score * kill;
  }

  // 보스 처치 수 계산
  const boss = bosses.data.find((b) => b.id === bosskill);
  if (!boss) {
    console.error("보스 찾기 실패");
    return;
  }
  bossKillScore += boss.score;

  // 웨이브 전체 처리 여부 계산
  for (const [waveId, allkill] of isAllkill) {
    const wave = wave.data.find((w) => w.id === waveId);
    if (!wave) {
      console.error("웨이브 찾기 실패");
      continue;
    }
    allKillScore += wave.all_kill_score * (allkill ? 1 : 0);
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
