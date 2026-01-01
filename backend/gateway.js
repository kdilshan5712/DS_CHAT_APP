// fileName: backend/gateway.js
require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const ServerModel = require("./models/Server");

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("✅ Gateway Connected to DB");
}).catch(err => console.error("DB Error:", err));

// ROUND-ROBIN COUNTER
let requestCounter = 0;

app.get("/dispatch", async (req, res) => {
    try {
        const activeServers = await ServerModel.find({ status: "UP" });

        if (activeServers.length === 0) {
            return res.status(503).json({ error: "No chat servers available" });
        }

        // 1. ROUND-ROBIN LOGIC (Force Alternating)
        // If counter is 0, pick server[0]. If 1, pick server[1]. Etc.
        const index = requestCounter % activeServers.length;
        const target = activeServers[index];
        
        // Increment for the next user
        requestCounter++;

        console.log(`🔀 Dispatching request #${requestCounter} to: ${target.serverName}`);
        
        res.json({ url: `http://localhost:${target.port}`, name: target.serverName });

    } catch (err) {
        res.status(500).json({ error: "Gateway Error" });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`\n🚦 LOAD BALANCER (Gateway) running on port ${PORT}`);
});