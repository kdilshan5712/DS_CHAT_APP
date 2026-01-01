const mongoose = require("mongoose");
module.exports = mongoose.model("Server", new mongoose.Schema({
  serverName: String,
  port: Number,
  status: String,
  lastHeartbeat: Date
}));