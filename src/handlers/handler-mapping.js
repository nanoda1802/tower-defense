import { gameStart, gameEnd, gameSave, gameLoad } from "./game-handler.js";
import { collideHandler } from "./headquater-handler.js";
import { createBossHandler, createMonsterHandler, moveMonsterHandler, moveBossHandler } from "./monster-handler.js";
import {
  getTowerHandler,
  sellTowerHandler,
  upgradeTowerHandler,
  attackHandler,
} from "./tower-handler.js";
import { waveChangeHandler } from "./wave-handler.js";

const handlerMappings = {
  11: gameStart,
  12: gameEnd,
  13: gameSave,
  14: gameLoad,
  21: collideHandler,
  31: createMonsterHandler,
  32: createBossHandler,
  33: moveMonsterHandler,
  34: moveBossHandler,
  41: getTowerHandler,
  42: sellTowerHandler,
  43: upgradeTowerHandler,
  44: attackHandler,
  51: waveChangeHandler,
};

export default handlerMappings;
