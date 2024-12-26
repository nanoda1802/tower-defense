import { addUser } from "../models/user-model.js";
import { handleDisconnect, handlerEvent, handleConnection } from "./helper.js";
// import { waveChangeHandler } from "../handlers/wave-handler.js";

const registerHandler = (io) => {
  io.on("connection", async (socket) => {
    let userId = socket.handshake.query.userId;

    addUser({ userId, socketId: socket.id });
    handleConnection(socket, userId);

    const gameAssets = getGameAssets(); //assets파일을 public으로 보내기
    socket.emit('gameAssets', gameAssets);

    //Event
    socket.on("event", (data) => handlerEvent(io, socket, data));

    //Disconnect
    socket.on("disconnect", () => {
      handleDisconnect(socket, userUUID);
    });
  });
};

export default registerHandler;
