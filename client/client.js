// fileName: client/client.js
let socket;
let username;
let room;

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const messagesDiv = document.getElementById('messages');
const statusDot = document.getElementById('statusDot');
const serverStatus = document.getElementById('serverStatus');
const GATEWAY_URL = "http://localhost:8080/dispatch";

function joinChat() {
    username = document.getElementById('usernameInput').value.trim();
    room = document.getElementById('roomInput').value.trim();

    if (!username || !room) return alert("Please enter both name and room");

    joinScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    document.getElementById('roomTitle').innerText = `#${room}`;
    document.getElementById('currentUser').innerText = `Logged in as ${username}`;

    connectToBestServer();
}

async function connectToBestServer() {
    serverStatus.innerText = "Finding best server...";
    statusDot.className = "indicator"; 

    try {
        const response = await fetch(GATEWAY_URL);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        console.log("Attempting connection to:", data.url);
        
        // Ensure previous socket is closed before making a new one
        if (socket) socket.close();

        socket = io(data.url, {
            reconnection: false // CRITICAL: We handle reconnection logic manually
        });

        setupSocketEvents(data.name);

    } catch (err) {
        serverStatus.innerText = "Retrying server search...";
        console.error("Gateway/Connection failed:", err);
        setTimeout(connectToBestServer, 2000);
    }
}

function setupSocketEvents(serverName) {
    // 1. SUCCESS: We connected!
    socket.on('connect', () => {
        statusDot.className = "indicator connected";
        serverStatus.innerText = `Connected to ${serverName}`;
        socket.emit('join_room', { room, username });
    });

    // 2. ERROR: The Gateway sent us to a dead server (Watchdog hasn't seen it yet)
    socket.on('connect_error', () => {
        console.warn(`Failed to connect to ${serverName}. Trying another...`);
        serverStatus.innerText = "Server unreachable. Switching...";
        // Immediate retry to find a better server
        setTimeout(connectToBestServer, 1000);
    });

    // 3. DISCONNECT: The server died while we were using it
    socket.on('disconnect', () => {
        statusDot.className = "indicator";
        serverStatus.innerText = "Server lost! Rebalancing...";
        setTimeout(connectToBestServer, 1000);
    });

    socket.on('receive_message', (data) => appendMessage(data));
}

function sendMessage() {
    const input = document.getElementById('msgInput');
    const message = input.value.trim();
    if (message && socket && socket.connected) {
        socket.emit('send_message', { username, room, message, timestamp: new Date() });
        input.value = "";
    }
}

function appendMessage(data) {
    const isMe = data.username === username;
    const div = document.createElement('div');
    if (data.username === 'System') {
        div.className = 'system-msg';
        div.innerText = data.message;
    } else {
        div.className = `msg ${isMe ? 'sent' : 'received'}`;
        div.innerHTML = `
            ${data.message}
            <span class="msg-meta">
                ${isMe ? 'You' : data.username} • ${new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                <br><span style="font-size:0.6em">via ${data.server || 'Unknown'}</span>
            </span>
        `;
    }
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }