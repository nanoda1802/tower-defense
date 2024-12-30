import { gameStart, gameEnd, gameSave, gameLoad } from "./game-handler.js";
import { collideHandler } from "./headquarter-handler.js";
import {
  createMonsterHandler,
  deathMonsterHandler,
} from "./monster-handler.js";
import {
  getTowerHandler,
  sellTowerHandler,
  upgradeTowerHandler,
  attackTowerHandler,
  buffTowerHandler,
  slowTowerHandler,
} from "./tower-handler.js";
import { waveChangeHandler } from "./wave-handler.js";

const eventHandlerMappings = {
  11: gameStart, // 해써
  12: gameEnd, // 위치만 잡아 놓음
  13: gameSave,
  14: gameLoad,
  21: collideHandler,
  41: getTowerHandler, // 해써
  42: sellTowerHandler, // 해써
  43: upgradeTowerHandler, // 해써
  44: attackTowerHandler, // 위치만 잡아 놓음
  45: buffTowerHandler,
  46: slowTowerHandler,
  51: waveChangeHandler,
};

const monsterHandlerMappings = {
  31: createMonsterHandler, // 해써
  32: deathMonsterHandler, // 해써
};

export { eventHandlerMappings, monsterHandlerMappings };
