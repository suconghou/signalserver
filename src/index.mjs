import * as process from 'process';
import WebSocket from 'ws';

const port = process.env.PORT || 5000;

function heartbeat() {
    this.isAlive = true;
}

const wss = new WebSocket.Server({ port });

wss.on('connection', (ws, { url }) => {
    const info = /uid\/([\w-]{36})$/.exec(url);
    if (!info) {
        return ws.terminate();
    }
    const uid = info[1];
    ws.uid = uid;
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.to) {
                broadcastIf(message, (ws) => ws.uid == data.to);
            } else {
                console.error('invalid msg', data);
            }
        } catch (e) {
            console.error(e);
        }
    });
    const ids = [];
    wss.clients.forEach((ws) => {
        if (ws.uid !== uid) {
            ids.push(ws.uid);
        }
    });
    ws.send(JSON.stringify({ event: 'init', ids: Array.from(new Set(ids)) }));
    broadcastIf(JSON.stringify({ event: 'online', id: uid }), (ws) => ws.uid != uid);
});

const broadcastIf = (data, fn) => {
    wss.clients.forEach((ws) => {
        fn(ws) && ws.send(data);
    });
};

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});
