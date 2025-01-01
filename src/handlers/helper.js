import { CLIENT_VERSION } from "../constants.js";
import { rooms, Room } from "../room/room.js";
import { getUser, removeUser } from "../models/user-model.js";
import {
  eventHandlerMappings,
  monsterHandlerMappings,
  towerHandlerMappings,
  attackHandlerMappings,
} from "./handler-mapping.js";
import { getGameAssets } from "../inits/assets.js";

/* 연결 해제 관리 */
export const handleDisconnect = (socket) => {
  removeUser(socket.id);
  console.log(`User disconnected: ${socket.id}`);
  console.log(`Current users`, getUser());
};

/* 연결 관리 */
export const handleConnection = async (socket, userId) => {
  console.log(`User connected!: ${userId} with socket ID ${socket.id}`);
  console.log("Current users : ", getUser());
  // [1] Room 인스턴스 생성
  const newRoomKey = rooms.length + 1;
  const room = new Room(newRoomKey, userId);
  rooms.push(room);
  // [2] assets 데이터 전체 조회
  const assets = getGameAssets();
  // [3] connection 성공 응답과 함께 assets 데이터 클라이언트에 전달
  socket.emit("connection", { userId, assets });
};
/* event 메세지 관리 */
export const handleEvent = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit("eventResponse", {
      status: "fail",
      message: "Client version mismatch",
    });
    return;
  }

  const handler = eventHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit("eventResponse", {
      status: "fail",
      message: "Handler not found",
    });
  }
  const response = await handler(data.userId, data.payload);
  // if (response.broadcast) {
  //   io.emit("response", response);
  //   return;
  // }

  socket.emit("eventResponse", { ...response, handlerId: data.handlerId });
};

/* monster 메세지 관리 */
export const handleMonster = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit("monsterResponse", {
      status: "fail",
      message: "Client version mismatch",
    });
    return;
  }

  const handler = monsterHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit("monsterResponse", {
      status: "fail",
      message: "Handler not found",
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit("monsterResponse", { ...response, handlerId: data.handlerId });
};

/* tower 메세지 관리 */
export const handleTower = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit("towerResponse", {
      status: "fail",
      message: "Client version mismatch",
    });
    return;
  }

  const handler = towerHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit("towerResponse", {
      status: "fail",
      message: "Handler not found",
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit("towerResponse", { ...response, handlerId: data.handlerId });
};

/* attack 메세지 관리 */
export const handleAttack = async (io, socket, data) => {
  if (!CLIENT_VERSION.includes(data.clientVersion)) {
    socket.emit("attackResponse", {
      status: "fail",
      message: "Client version mismatch",
    });
    return;
  }

  const handler = attackHandlerMappings[data.handlerId];
  if (!handler) {
    socket.emit("attackResponse", {
      status: "fail",
      message: "Handler not found",
    });
  }
  const response = await handler(data.userId, data.payload);

  socket.emit("attackResponse", { ...response, handlerId: data.handlerId });
};
