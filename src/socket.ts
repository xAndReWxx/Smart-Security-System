import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["polling"], // ✅ الحل
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});
