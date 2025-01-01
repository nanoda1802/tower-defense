import { addUser } from "../models/user-model.js";
import {
  handleDisconnect,
  handleEvent,
  handleConnection,
  handleMonster,
  handleTower,
  handleAttack,
} from "./helper.js";

const registerHandler = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.user?.userId; // JWT에서 추출된 userId

    addUser({ userId, socketId: socket.id });
    handleConnection(socket, userId);

    //Event
    socket.on("event", (data) => handleEvent(io, socket, data));

    //Monster
    socket.on("monster", (data) => handleMonster(io, socket, data));

    //Tower
    socket.on("tower", (data) => handleTower(io, socket, data));

    //attack
    socket.on("attack", (data) => handleAttack(io, socket, data));

    //Disconnect
    socket.on("disconnect", () => {
      handleDisconnect(socket, userId);
    });
  });
};

export default registerHandler;
