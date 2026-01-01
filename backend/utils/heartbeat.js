const ServerModel = require("../models/Server");
module.exports = (name, port) => {
    const beat = () => {
        ServerModel.findOneAndUpdate(
            { serverName: name },
            { serverName: name, port, status: "UP", lastHeartbeat: new Date() },
            { upsert: true, new: true }
        ).exec().catch(err => console.error("Heartbeat Error:", err));
    };
    beat();
    setInterval(beat, 5000);
};