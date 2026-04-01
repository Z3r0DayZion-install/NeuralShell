const { WebSocketServer } = require("ws");

function safeJsonParse(raw) {
  try {
    const parsed = JSON.parse(String(raw || ""));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

class LocalCollabSignalServer {
  constructor(options = {}) {
    this.host = String(options.host || "127.0.0.1");
    this.port = Number(options.port || 55116);
    this.logger = typeof options.logger === "function" ? options.logger : () => {};
    this.wss = null;
    this.rooms = new Map();
  }

  status() {
    return {
      running: Boolean(this.wss),
      host: this.host,
      port: this.port,
      rooms: this.rooms.size
    };
  }

  start() {
    if (this.wss) return this.status();
    this.wss = new WebSocketServer({
      host: this.host,
      port: this.port
    });
    this.wss.on("connection", (socket) => {
      socket.__roomId = "";
      socket.__peerId = "";

      socket.send(JSON.stringify({
        action: "ready",
        host: this.host,
        port: this.port
      }));

      socket.on("message", (raw) => {
        const message = safeJsonParse(raw);
        if (!message) return;

        const action = String(message.action || "");
        if (action === "join") {
          const roomId = String(message.room || "").trim();
          const peerId = String(message.peerId || "").trim();
          if (!roomId || !peerId) {
            socket.send(JSON.stringify({ action: "error", reason: "join_requires_room_and_peer" }));
            return;
          }
          socket.__roomId = roomId;
          socket.__peerId = peerId;
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
          }
          this.rooms.get(roomId).add(socket);
          socket.send(JSON.stringify({
            action: "joined",
            room: roomId,
            peerId
          }));
          return;
        }

        if (action === "publish") {
          const roomId = String(message.room || socket.__roomId || "").trim();
          if (!roomId || !this.rooms.has(roomId)) return;
          const peers = this.rooms.get(roomId);
          const packet = JSON.stringify({
            action: "event",
            room: roomId,
            fromPeerId: String(socket.__peerId || ""),
            eventType: String(message.eventType || ""),
            payload: message.payload && typeof message.payload === "object" ? message.payload : {},
            sentAt: new Date().toISOString()
          });
          for (const peerSocket of peers) {
            if (peerSocket === socket) continue;
            if (peerSocket.readyState !== peerSocket.OPEN) continue;
            peerSocket.send(packet);
          }
          return;
        }
      });

      socket.on("close", () => {
        const roomId = String(socket.__roomId || "");
        if (!roomId || !this.rooms.has(roomId)) return;
        const peers = this.rooms.get(roomId);
        peers.delete(socket);
        if (peers.size === 0) {
          this.rooms.delete(roomId);
        }
      });
    });

    this.logger("started", {
      host: this.host,
      port: this.port
    });
    return this.status();
  }

  stop() {
    if (!this.wss) return;
    for (const peers of this.rooms.values()) {
      for (const socket of peers) {
        try {
          socket.close(1001, "server_shutdown");
        } catch {
          // ignore
        }
      }
    }
    this.rooms.clear();
    this.wss.close();
    this.wss = null;
    this.logger("stopped", {
      host: this.host,
      port: this.port
    });
  }
}

module.exports = {
  LocalCollabSignalServer
};

