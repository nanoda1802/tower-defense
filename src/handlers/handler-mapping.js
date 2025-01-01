import { gameStart, gameEnd } from "./game-handler.js";
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
import { handleRoomJoin, handleGameStateUpdate } from "./temp-room-handler.js";

const eventHandlerMappings = {
  11: gameStart, // 해써
  12: gameEnd, // 위치만 잡아 놓음
  21: collideHandler,
  51: waveChangeHandler,
  101: handleRoomJoin,
  102: handleGameStateUpdate,
};

const spawnHandlerMappings = {
  31: createMonsterHandler, // 해써
};

const killHandlerMappings = {
  32: deathMonsterHandler, // 해써
};

const towerHandlerMappings = {
  41: getTowerHandler, // 해써
  42: sellTowerHandler, // 해써
  43: upgradeTowerHandler, // 해써
  45: buffTowerHandler,
  46: slowTowerHandler,
};

const attackHandlerMappings = {
  44: attackTowerHandler, // 위치만 잡아 놓음
};

export {
  eventHandlerMappings,
  spawnHandlerMappings,
  killHandlerMappings,
  towerHandlerMappings,
  attackHandlerMappings,
};
