import { io } from "socket.io-client";

if (!process.env.ACCESS_TOKEN) {
    console.error("Set ACCESS_TOKEN to a valid access token; anonymous connections are rejected.");
    process.exit(1);
}
const socket = io("http://localhost:3001/chat", {
    transports: ["websocket"],
    auth: { token: process.env.ACCESS_TOKEN },
    timeout: 5000,
    reconnection: false,
});

socket.on("connect", () => {
    console.log("connected:", socket.id);

    setTimeout(() => {
        socket.disconnect();
    }, 1000);
});

socket.on("disconnect", (reason) => {
    console.log("disconnected:", reason);
    process.exit(0);
});

socket.on("connect_error", (error) => {
    console.error("connect_error:", error.message);
    process.exit(1);
});