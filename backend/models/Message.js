const mongoose = require("mongoose");
module.exports = mongoose.model("Message", new mongoose.Schema({
  username: String,
  room: String,
  message: String,
  server: String,
  timestamp: { type: Date, default: Date.now }
}));