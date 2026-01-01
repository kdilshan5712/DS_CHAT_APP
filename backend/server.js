require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./socket/socketHandler");
const startHeartbeat = require("./utils/heartbeat");
const connectDB = require("./config/db");

connectDB();
const server = http.createServer(app);
const NAME = process.env.SERVER_NAME || "Server-A";
const PORT = process.env.PORT || 3000;

startHeartbeat(NAME, PORT);
initSocket(server, NAME);

server.listen(PORT, () => {
  console.log(`🚀 ${NAME} started on port ${PORT}`);
});