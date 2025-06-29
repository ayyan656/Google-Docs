import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],        // Use WebSocket only
  withCredentials: true,            // Allow cross-origin cookies if needed
  reconnection: true,               // Enable auto-reconnect
  reconnectionAttempts: 10,         // Try to reconnect 10 times
  reconnectionDelay: 2000,          // Wait 2 seconds between attempts
  reconnectionDelayMax: 5000,       // Max delay of 5 seconds
  timeout: 10000                    // Wait 10s before timing out a connection
});

export default socket;
