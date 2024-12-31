import { getGameAssets } from '../inits/assets.js';
import {
  setAliveMonsters,
  getAliveMonsters,
  removeAliveMonsters,
  setDeathMonsters,
} from '../models/monster-model.js';
import { getGold, setGold } from '../models/gold-model.js';
import { getScore, setScore } from '../models/score-model.js';

/* CreateMonsterHandler 31 */
export const createMonsterHandler = (userId, payload) => {
  try {
    let isBoss = false;
    const { monsters, waves } = getGameAssets(); //assets파일의 monsters, bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
    const { timestamp, waveId, monsterId, monsterIndex } = payload; //socket으로 받을 payload정보 리스트
    //timestamp는소환시간 검증(ex. 소환간격 검증), montserId는 몬스터 정보 검증, monsterIndex는 몬스터 총량이 일치하는지 검증
    console.log('createMonsterHandler timestamp : ', timestamp);
    // 몬스터 정보 조회
    const monster = monsters.data.find((monster) => monster.id === monsterId);
    if (!monster) {
      return { status: 'fail', message: '존재하지 않는 몬스터 id입니다.' };
    }

    // 몬스터 출현 스테이지 검증
    const monsterWave = waves.data.find((wave) => wave.id === waveId);
    if (monsterWave.monster_id !== monsterId && monsterWave.boss_id !== monsterId) {
      //waveId를 검증한 후 해당 monsterId와 payload의 monsterId 검증
      return {
        status: 'fail',
        message: '해당 스테이지의 몬스터 id가 아닙니다.',
      };
    }

    //몬스터 개체수 검증
    if (monsterWave.monster_cnt < monsterIndex) {
      return { status: 'fail', message: '몬스터가 너무 많이 나왔습니다.' };
    } //몬스터인덱스가 웨이브 숫자보다 높아지면 에러

    //보스몬스터 출현 검증)
    if (monsterIndex === monsterWave.monster_cnt) {
      //몬스터 인덱스가 웨이브의 몬스터 숫자와 같을때
      if (monsterId !== monster.id) {
        return { status: 'fail', message: '보스몬스터가 잘못 나왔습니다.' };
      }
    }

    // 몬스터 정보 저장
    const monsterHealth = monster.health;
    const monsterAttack = monster.attack;
    const monsterSpeed = monster.speed;
    const monsterGold = monster.gold;
    const monsterScore = monster.score;
    setAliveMonsters(
      userId,
      timestamp,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
    );
    // 보스인지 쳌
    isBoss = monsterId > 200 ? true : false;
    return {
      status: 'success',
      message: '몬스터 생성 성공',
      monsterId,
      monsterHealth,
      monsterAttack,
      monsterSpeed,
      monsterGold,
      monsterScore,
      monsterIndex,
      isBoss,
      handlerId: 31,
    };
  } catch (error) {
    throw new Error('몬스터 생성 실패 !! ' + error.message);
  }
};

/* deathMonsterHandler 32 */
export const deathMonsterHandler = (userId, payload) => {
  try {
    const { monsters } = getGameAssets();
    const aliveMonsters = getAliveMonsters(userId);
    const { timestamp, monsterId, monsterIndex, monsterHealth, monsterGold, monsterScore } =
      payload; //payloal 정보
    //죽은 몬스터가 살아있는 몬스터 배열에 있느지 검증
    const monster = aliveMonsters.find((monster) => {
      return monster.monsterId === monsterId && monster.monsterIndex === monsterIndex;
    });
    if (!monster) {
      return { status: 'fail', message: '죽은 몬스터의 정보가 없습니다.' };
    }

    //죽은 몬스터가 정말 체력이 0이 되었는지 검증
    if (monsterHealth > 0) {
      return { status: 'fail', message: '몬스터가 아직 살아있었습니다.' };
    }

    //살아있는 몬스터 데이터 삭제
    removeAliveMonsters(userId, monsterId, monsterIndex);

    //죽은 몬스터 데이터 저장
    setDeathMonsters(
      userId,
      timestamp,
      monsterId,
      monsterIndex,
      monsterHealth,
      monsterGold,
      monsterScore,
    );

    //골드 증가
    //현재 보유 골드 조회
    const usergold = getGold(userId);

    //해당 몬스터의 골드량이 맞는지 검증
    const rightGold = monsters.data.find((monster) => monster.id === monsterId).gold;
    if (rightGold !== monsterGold) {
      return { status: 'fail', message: 'Invalid monster gold' };
    }
    setGold(
      userId,
      usergold[usergold.length - 1].gold + monsterGold,
      monsterGold,
      'KILL',
      timestamp,
    );

    //점수 증가
    //현재 보유 점수 조회
    const userscore = getScore(userId);

    //해당 몬스터의 점수가 맞는지 검증
    const rightScore = monsters.data.find((monster) => monster.id === monsterId).score;
    if (rightScore !== monsterScore) {
      return { status: 'fail', message: 'Invalid monster score' };
    }

    setScore(
      userId,
      userscore[userscore.length - 1].sumScore + monsterScore,
      monsterScore,
      timestamp,
    );

    return {
      status: 'success',
      message: '몬스터 죽음',
      monsterHealth,
      monsterGold,
      monsterScore,
      handlerId: 32,
    };
  } catch (error) {
    throw new Error('몬스터 죽기 실패 !! ' + error.message);
  }
};

/* CreateBossHandler 32 */
// export const createBossHandler = (userId, payload) => {
//   try {
//     const { bosses, waves } = getGameAssets(); //assets파일의 bosses, waves 정보 불러오기 (클라이언트에서 가져온 데이터랑 비교할거임)
//     const { timestamp, waveId, bossId } = payload; //socket으로 받을 payload정보 리스트
//     //timestamp는 소환시간 검증, bossId는 보스 정보 검증

//     //보스 정보 조회
//     const boss = bosses.data.find((boss) => boss.id === bossId);
//     if (!boss) {
//       return { status: "fail", message: "Invalid boss ID" };
//     }

//     //보스 출현 스테이지 검증
//     const bossWave = waves.data.find((wave) => wave.id === waveId);
//     if (bossWave.boss_id !== bossId) {
//       //waveId를 검증한 후 해당 bossId와 payload의 bossId 검증
//       return { status: "fail", message: "Invalid boss ID" };
//     }

//     //보스 소환 시간 검증

//     //보스 정보 저장
//     const bossHealth = boss.health;
//     const bossAttack = boss.attack;
//     const bossSpeed = boss.speed;
//     const bossGold = boss.gold;
//     const bossScore = boss.score;
//     setAliveBosses(
//       userId,
//       timestamp,
//       bossId,
//       bossHealth,
//       bossAttack,
//       bossSpeed,
//       bossGold,
//       bossScore,
//     );
//   } catch (error) {
//     throw new Error("Failed to create boss !! " + error.message);
//   }
// };

/* deathBossHandler 34 */
// export const deathBossHandler = (userId, payload) => {
//   const { bosses } = getGameAssets(); //assets파일의 monsters 정보 불러오기
//   const { timestamp, bossId, x, y } = payload; //payloal 정보
//   //보스 ID, 이동한 좌표(이동 전도 가져와도됨)

//   //여기서 보스 ...
//   //const
// };

//클라이언트에서 몬스터가 이동한 코드대로 서버에서도 이동시키기 => 몬스터 움직임 하나하나를 검증할 필요없음
