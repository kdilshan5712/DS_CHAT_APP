// fileName: backend/socket/socketHandler.js
const { Server } = require("socket.io");
const Message = require("../models/Message");

module.exports.initSocket = (srv, serverName) => {
    const io = new Server(srv, {
        cors: { origin: "*" }
    });

    // 1. SYNC MECHANISM (The Missing Link)
    // Keep track of the last time we checked for updates
    let lastSyncTime = new Date();

    setInterval(async () => {
        try {
            // Find messages created AFTER our last check
            // AND that were handled by a DIFFERENT server
            const newMessages = await Message.find({
                timestamp: { $gt: lastSyncTime },
                server: { $ne: serverName } 
            });

            if (newMessages.length > 0) {
                // Update our sync time to the latest message found
                lastSyncTime = newMessages[newMessages.length - 1].timestamp;

                // Broadcast these "foreign" messages to our local clients
                newMessages.forEach(msg => {
                    io.to(msg.room).emit("receive_message", msg);
                });
            }
        } catch (err) {
            console.error("Sync Error:", err);
        }
    }, 1000); // Check every 1 second (1000ms)

    // 2. Standard Socket Logic
    io.on("connection", (socket) => {
        console.log(`[${serverName}] New Client: ${socket.id}`);

        socket.on("join_room", (data) => {
            socket.join(data.room);
            // Notify just this room locally
            const sysMsg = {
                username: "System",
                message: `${data.username} joined.`,
                room: data.room,
                server: serverName,
                timestamp: new Date()
            };
            io.to(data.room).emit("receive_message", sysMsg);
        });

        socket.on("send_message", async (data) => {
            try {
                // Save to Shared DB
                const savedMessage = await Message.create({
                    ...data,
                    server: serverName,
                    timestamp: new Date() // Ensure exact server time
                });

                // Broadcast to LOCAL clients immediately
                io.to(data.room).emit("receive_message", savedMessage);
                
                // (The Sync Interval will handle telling the OTHER servers)
            } catch (err) {
                console.error("Message Error:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log(`[${serverName}] Client Disconnected: ${socket.id}`);
        });
    });
};