import { io } from "socket.io-client";

const socket = io("http://localhost:3001/chat", {
    transports: ["websocket"],
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