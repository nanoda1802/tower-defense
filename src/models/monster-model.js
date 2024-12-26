
// 몬스터의 현재 위치정보, 체력, 아이디, 생성시간, 스테이지아이디, 보유 골드, (여기서 인덱스 만들기)

// 보스의 현재 위치정보, 체력, 아이디, 생성시간, 스테이지 아이디, 보유 골드, (인덱스 필요없음)

const aliveMonsters = []

const deathMonsters = []


const aliveBosses = []

const deathBosses = []



//살아있는 몬스터 데이터 가져오기
export const getAliveMonsters = (userId) => {
    return aliveMonsters[userId];
}

//살아있는 몬스터 데이터 저장하기
export const setAliveMonsters = (userId, timestamp, monsterId, monsterIndex, monsterHealth, monsterAttack, monsterSpeed, monsterGold, monsterScore) => {
    return aliveMonsters[userId].push({
        timestamp,
        monsterId,
        monsterIndex,
        monsterHealth,
        monsterAttack,
        monsterSpeed,
        monsterGold,
        monsterScore
    });
}

//죽은 몬스터 데이터 가져오기
export const getDeathMonsters = (userId) => {
    return deathMonsters[userId];
}

//죽은 몬스터 데이터 저장하기
export const setDeathMonsters = (userId) => {
    return deathMonsters[userId].push({
        timestamp,
        monsterId,
        monsterIndex,
        monsterHealth,
        monsterAttack,
        monsterSpeed,
        monsterGold,
        monsterScore
    });
}




//살아있는 보스 데이터 가져오기
export const getAliveBosses = (userId) => {
    return aliveBosses[userId];
}

//살아있는 보스 데이터 저장하기
export const setAliveBosses = (userId, timestamp, bossId, bossHealth, bossAttack, bossSpeed, bossGold, bossScore) => {
    return aliveBosses[userId].push({
        timestamp,
        bossId,
        bossHealth,
        bossAttack,
        bossSpeed,
        bossGold,
        bossScore
    });
}

//죽은 보스 데이터 가져오기
export const getDeathBosses = (userId) => {
    return deathBosses[userId];
}

//죽은 보스 데이터 저장하기
export const setDeathBosses = (userId) => {
    return deathBosses[userId].push({
        timestamp,
        bossId,
        bossHealth,
        bossAttack,
        bossSpeed,
        bossGold,
        bossScore
    });
}