import { CLIENT_VERSION } from "../constants.js";
import { createWave } from "../models/wave-model.js";
import { getUser, removeUser } from "../models/user-model.js";
import handlerMappings from "./handler-mapping.js";
import { getGameAssets } from "../inits/assets.js";
import { createAliveMonsters } from "../models/monster-model.js";
import { createTower, clearRemoveTower } from "../models/tower-model.js";
import { createGold, setGold } from "../models/gold-model.js";

export const handleDisconnect = (socket) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);
  console.log(`Current users`, getUser());
};

export const handleConnection = async (socket, userId) => {
  console.log(`User connected!: ${userId} with socket ID ${socket.id}`);
  console.log("Current users : ", getUser());
  createAliveMonsters(userId);
  //데이터 데이블 전체 조회
  const assets = getGameAssets();
  console.log("!!!!!connection!!!!!!", userId);
  //해당 유저의 웨이브 생성
  createWave(userId);
  createTower(userId);
  clearRemoveTower(userId);
  createGold(userId);
  setGold(userId, 100, 0, "start", Date.now());

  socket.emit("connection", { userId, assets });
};

export const handlerEvent = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit("response", {
      status: "fail",
      message: "Client version mismatch",
    });
    return;
  }

  const handler = handlerMappings[data.handlerId];
  if (!handler) {
    socket.emit("response", { status: "fail", message: "Handler not found" });
  }
  console.log("!!!!!!!!event!!!!!!!", data.userId);
  const response = await handler(data.userId, data.payload);
  // if (response.broadcast) {
  //   io.emit("response", response);
  //   return;
  // }

  socket.emit("response", { ...response, handlerId: data.handlerId });
};
