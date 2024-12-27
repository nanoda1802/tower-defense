import { getGameAssets } from "../inits/assets.js";

export const calculateMonsterMove = (userId, payload) => {
  const { monsters } = getGameAssets();
  const { timestamp, monsterId, monsterIndex } = payload;
};
