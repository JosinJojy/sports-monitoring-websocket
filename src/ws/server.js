import {WebSocket, WebSocketServer} from 'ws'

function sendJSON(socket, payload){
    if (socket.readyState !== WebSocket.OPEN) return
    try {
        socket.send(JSON.stringify(payload))
    } catch (error) {
        console.error("WebSocket send failed", error)
    }
}

function broadcast(wss, payload){
    wss.clients.forEach((client)=>{
        sendJSON(client, payload)
    })
}

export function attachWebSocketServer(server){
    const wss = new WebSocketServer({
        server,
        path:'/ws',
        maxPayload: 1024*1024 // 1 MB
    })

    wss.on('connection', (socket) => {
        sendJSON(socket, {type: "welcome"})
        socket.on('error', console.error)
    })

    function broadcastMatchCreated(match){
        broadcast(wss, {type:"match created", data:match})
    }

    return {broadcastMatchCreated}
}