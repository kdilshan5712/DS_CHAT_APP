require("dotenv").config();
const mongoose = require("mongoose");
const ServerModel = require("../models/Server");

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("🦅 Watchdog Started");
    setInterval(async () => {
        const now = Date.now();
        const servers = await ServerModel.find();
        servers.forEach(s => {
            if (now - new Date(s.lastHeartbeat).getTime() > 8000 && s.status === "UP") {
                ServerModel.updateOne({ serverName: s.serverName }, { status: "DOWN" }).exec();
                console.log(`⚠️ DETECTED FAILURE: ${s.serverName} is DOWN`);
            }
        });
    }, 5000);
});