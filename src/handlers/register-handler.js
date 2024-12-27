import { addUser } from "../models/user-model.js";
import { handleDisconnect, handlerEvent, handleConnection } from "./helper.js";

const registerHandler = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.user?.userId; // JWT에서 추출된 userId

    addUser({ userId, socketId: socket.id });
    console.log("!!!register!!!", userId);
    handleConnection(socket, userId);

    //Event
    socket.on("event", (data) => handlerEvent(io, socket, data));

    //Disconnect
    socket.on("disconnect", () => {
      handleDisconnect(socket, userId);
    });
  });
};

export default registerHandler;
