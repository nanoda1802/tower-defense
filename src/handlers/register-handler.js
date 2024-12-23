import { addUser } from "../models/user-model.js";
import { handleDisconnect, handlerEvent, handleConnection } from "./helper.js";

const registerHandler = (io) => {
  io.on("connection", async (socket) => {
    let userId = socket.handshake.query.userId;

    addUser({ userId, socketId: socket.id });
    handleConnection(socket, userId, type);

    //Event
    socket.on("event", (data) => handlerEvent(io, socket, data));

    //Disconnect
    socket.on("disconnect", () => {
      handleDisconnect(socket, userUUID);
    });
  });
};

export default registerHandler;
