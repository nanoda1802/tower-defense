import { gameStart, gameEnd, gameSave, gameLoad } from './game-handler.js';
import { collideHandler } from './headquater-handler.js';
import {
  createBossHandler,
  createMonsterHandler,
  deathMonsterHandler,
  deathBossHandler,
} from './monster-handler.js';
import {
  getTowerHandler,
  sellTowerHandler,
  upgradeTowerHandler,
  attackTowerHandler,
  buffTowerHandler,
  slowTowerHandler,
} from './tower-handler.js';
import { nextWaveHandler } from './wave-handler.js';
import { handleRoomJoin, handleGameStateUpdate } from './room-handler.js';

const handlerMappings = {
  11: gameStart, // 해써
  12: gameEnd, // 위치만 잡아 놓음
  13: gameSave,
  14: gameLoad,
  21: collideHandler,
  31: createMonsterHandler, // 해써
  32: createBossHandler,
  33: deathMonsterHandler, // 해써
  34: deathBossHandler,
  41: getTowerHandler, // 해써
  42: sellTowerHandler, // 해써
  43: upgradeTowerHandler, // 해써
  44: attackTowerHandler, // 위치만 잡아 놓음
  45: buffTowerHandler,
  46: slowTowerHandler,
  51: nextWaveHandler,
  101: handleRoomJoin,
  102: handleGameStateUpdate,
};

export default handlerMappings;
