import { WebSocket, WebSocketServer } from "ws";
import { wsArcject } from "../arcjet.js";

function sendJSON(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  try {
    socket.send(JSON.stringify(payload));
  } catch (error) {
    console.error("WebSocket send failed", error);
  }
}

function broadcast(wss, payload) {
  wss.clients.forEach((client) => {
    sendJSON(client, payload);
  });
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024, // 1 MB
  });

  wss.on("connection", async(socket, req) => {
    if (wsArcject) {
      try {
        const decision = await wsArcject.protect(req)

        if(decision.isDenied()){
            const code = decision.reason.isRateLimit() ? 1013 : 1008
            const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied'
            socket.close(code, reason)
            return
        }

      } catch (error) {
        console.error("WS connection error : ", error);
        socket.close(1011, "Server security error");
        return
      }
    }
    sendJSON(socket, { type: "welcome" });
    socket.on("error", console.error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: "match created", data: match });
  }

  return { broadcastMatchCreated };
}
