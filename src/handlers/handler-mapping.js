import { gameStart, gameEnd, gameSave, gameLoad } from "./game-handler.js";
import { collideHandler } from "./headquater-handler.js";
import {
  createBossHandler,
  createMonsterHandler,
  moveMonsterHandler,
  moveBossHandler,
} from "./monster-handler.js";
import {
  getTowerHandler,
  sellTowerHandler,
  upgradeTowerHandler,
  attackHandler,
} from "./tower-handler.js";
import { waveChangeHandler } from "./wave-handler.js";

const handlerMappings = {
  11: gameStart, // 해써
  12: gameEnd, // 위치만 잡아 놓음
  13: gameSave,
  14: gameLoad,
  21: collideHandler,
  31: createMonsterHandler, // 해써
  32: createBossHandler,
  33: moveMonsterHandler, // 해써
  34: moveBossHandler,
  41: getTowerHandler, // 해써
  42: sellTowerHandler, // 해써
  43: upgradeTowerHandler, // 해써
  44: attackHandler, // 위치만 잡아 놓음
  51: waveChangeHandler,
};

export default handlerMappings;
