import { getGameAssets } from "../inits/assets.js";
import { setAliveMonsters, setAliveBosses } from "../models/monster-model.js";

/* CreateMonsterHandler 31 */
export const createMonsterHandler = (userId, payload) => {
  try {
    const { monsters, waves } = getGameAssets(); //assets파일의 monsters, bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
    const { timestamp, waveId, monsterId, monsterIndex } = payload; //socket으로 받을 payload정보 리스트
    //timestamp는 소환시간 검증(ex. 소환간격 검증), montserId는 몬스터 정보 검증, monsterIndex는 몬스터 총량이 일치하는지 검증

    //몬스터 정보 조회
    const monster = monsters.data.find((monster) => monster.id === monsterId);
    if (!monster) {
      return { status: "fail", message: "Invalid monster ID" };
    }

    //몬스터 출현 스테이지 검증
    const monsterWave = waves.data.find((wave) => wave.id === waveId);
    if (monsterWave.monster_id !== monsterId) {
      //waveId를 검증한 후 해당 monsterId와 payload의 monsterId 검증
      return { status: "fail", message: "Invalid monster ID" };
    }

    //몬스터 개체수 검증
    if (monsterWave.monster_cnt <= monsterIndex) {
      return { status: "fail", message: "Invalid monster index" };
    } //몬스터인덱스가 웨이브 숫자보다 높아지면 에러

    //몬스터 소환 시간 패턴 검증

    // 몬스터 정보 저장
    const monsterHealth = monster.health;
    const monsterAttack = monster.attack;
    const monsterSpeed = monster.speed;
    const monsterGold = monster.gold;
    const monsterScore = monster.score;
    setAliveMonsters(userId, timestamp, monsterId, monsterIndex, monsterHealth, monsterAttack, monsterSpeed, monsterGold, monsterScore);
    return {
      status: "success",
      message: "몬스터 생성 성공",
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
      handlerId: 31,
    };
  } catch (error) {
    throw new Error("Failed to create monster !! " + error.message);
  }
};

/* CreateBossHandler 32 */
export const createBossHandler = (userId, payload) => {
  try {
    const { bosses, waves } = getGameAssets(); //assets파일의 bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
    const { timestamp, waveId, bossId } = payload; //socket으로 받을 payload정보 리스트
    //timestamp는 소환시간 검증, bossId는 보스 정보 검증

    //보스 정보 조회
    const boss = bosses.data.find((boss) => boss.id === bossId);
    if (!boss) {
      return { status: "fail", message: "Invalid boss ID" };
    }

    //보스 출현 스테이지 검증
    const bossWave = waves.data.find((wave) => wave.id === waveId);
    if (bossWave.boss_id !== bossId) {
      //waveId를 검증한 후 해당 bossId와 payload의 bossId 검증
      return { status: "fail", message: "Invalid boss ID" };
    }

    //보스 소환 시간 검증

    //보스 정보 저장
    const bossHealth = boss.health;
    const bossAttack = boss.attack;
    const bossSpeed = boss.speed;
    const bossGold = boss.gold;
    const bossScore = boss.score;
    setAliveBosses(userId, timestamp, bossId, bossHealth, bossAttack, bossSpeed, bossGold, bossScore);
  } catch (error) {
    throw new Error("Failed to create boss !! " + error.message);
  }
};

/* MoveMonsterHandler 33 */
export const moveMonsterHandler = (userId, payload) => {
  const { monsters } = getGameAssets(); //assets파일의 monsters 정보 불러오기
  const { timestamp, monsterIndex, x, y } = payload; //payloal 정보
  //몬스터 번호, 이동한 좌표(이동 전도 가져와도됨)

  //여기서 몬스터의 스피드가 맞는지, 제시된 길을 벗어나지 않는지 검증하기만 하면 될듯!
  //const ..
};

/* MoveBossHandler 34 */
export const moveBossHandler = (userId, payload) => {
  const { bosses } = getGameAssets(); //assets파일의 monsters 정보 불러오기
  const { timestamp, bossId, x, y } = payload; //payloal 정보
  //보스 ID, 이동한 좌표(이동 전도 가져와도됨)

  //여기서 보스 ...
  //const
};

//클라이언트에서 몬스터가 이동한 코드대로 서버에서도 이동시키기 => 몬스터 움직임 하나하나를 검증할 필요없음
