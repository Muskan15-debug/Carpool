import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnection: true,
      auth: {
        token,
      },
    });
  }
  
  // Update token if it changes (e.g. user logs in)
  if (token && socket.auth) {
    (socket.auth as any).token = token;
  }
  
  return socket;
};
