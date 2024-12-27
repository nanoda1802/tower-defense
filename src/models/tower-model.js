// const towers = {};
const removeTowers = {};

const towers = {
  tester: [
    {
      positionX: 0,
      positionY: 0,
      type: 'pawn',
      data: {
        id: 1001,
        card: '1',
        color: 'red',
        attack: 10,
        attack_speed: 10,
        range: 5,
        splash: 2,
      },
      isGetBuff: false,
      buffTowerPos: null,
      buffTowerArr: [],
    },
    {
      positionX: 1,
      positionY: 0,
      type: 'pawn',
      data: {
        id: 1002,
        card: '1',
        color: 'black',
        attack: 10,
        attack_speed: 10,
        range: 5,
        splash: 0,
      },
      isGetBuff: false,
      buffTowerPos: null,
      buffTowerArr: [],
    },
    {
      positionX: 2,
      positionY: 0,
      type: 'special',
      data: {
        id: 1002,
        card: 'joker',
        color: 'none',
        attack: 10,
        attack_speed: 10,
        range: 5,
        splash: 0,
      },
      isGetBuff: false,
      buffTowerPos: null,
      buffTowerArr: [],
    },
    {
      positionX: 0,
      positionY: 1,
      type: 'special',
      data: {
        id: 2001,
        card: 'J',
        type: 'buffer',
        color: 'red',
        attack: 10,
        attack_speed: 10,
        range: 5,
        splash: 0,
      },
      isGetBuff: false,
      buffTowerPos: null,
      buffTowerArr: [],
    },
    {
      positionX: 0,
      positionY: 2,
      type: 'special',
      data: {
        id: 2004,
        card: 'J',
        color: 'black',
        type: 'buffer',
        attack: 10,
        attack_speed: 10,
        range: 5,
        splash: 0,
      },
      isGetBuff: false,
      buffTowerPos: null,
      buffTowerArr: [],
    },
  ],
};

//스테이지 초기화
export const createTower = (userId) => {
  towers[userId] = [];
};

export const getTower = (userId) => {
  return towers[userId];
};

export const setTower = (userId, positionX, positionY, type, timestamp, data, isGetBuff, buffTowerPos, buffTowerArr) => {
  return towers[userId].push({ userId, positionX, positionY, type, isBuff, timestamp, data, isGetBuff, buffTowerPos, buffTowerArr });
};

export const clearTower = (userId) => {
  towers[userId] = [];
};

export const clearRemoveTower = (userId) => {
  removeTowers[userId] = [];
};

export const removeTower = (userId, towerId, positionX, positionY, timestamp) => {
  const index = towers[userId].findIndex((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    removeTowers[userId].push(towers[userId][index], timestamp);
    return towers[userId].splice(index, 1)[0];
  }
};

export const upgradeTower = (userId, towerId, positionX, positionY) => {
  const index = towers[userId].findIndex((tower) => tower.data.id === towerId && tower.positionX === positionX && tower.positionY === positionY);
  if (index !== -1) {
    towers[userId][index].data.card = Number(towers[userId][index].data.card) + 1 + '';
    towers[userId][index].data.attack = towers[userId][index].data.attack + 1;
    towers[userId][index].data.attack_speed = towers[userId][index].data.attack_speed + 0.2;
    towers[userId][index].data.range = towers[userId][index].data.range + 0.1;
  }
};

export const getRemoveTower = (userId) => {
  return removeTowers[userId];
};
