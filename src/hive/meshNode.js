import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * MeshNode (The P2P Cortex)
 * 
 * Enables decentralized communication between NeuralShell instances.
 * Features:
 * - Peer Discovery (via Seed Nodes or manual peering)
 * - Gossip Protocol (Broadcast messages to all)
 * - Direct Messaging (Private comms)
 */
export class MeshNode extends EventEmitter {
  constructor(port = 4000, peers = []) {
    super();
    this.id = crypto.randomUUID();
    this.port = port;
    this.peers = new Map(); // id -> ws
    this.seedPeers = peers;
    this.seenMessages = new Set(); // Dedup for gossip
  }

  async start() {
    // 1. Start Server
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    console.log(`[Hive] MeshNode ${this.id.slice(0,8)} listening on :${this.port}`);

    // 2. Connect to Seeds
    for (const peerUrl of this.seedPeers) {
      this.connectTo(peerUrl);
    }
  }

  connectTo(url) {
    console.log(`[Hive] Connecting to peer: ${url}`);
    const ws = new WebSocket(url);
    ws.on('open', () => this.handleConnection(ws, true));
    ws.on('error', (err) => console.warn(`[Hive] Peer connection error (${url}):`, err.message));
  }

  handleConnection(ws, isOutgoing = false) {
    // Handshake
    ws.send(JSON.stringify({ type: 'handshake', id: this.id }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleMessage(ws, msg);
      } catch (e) { console.error('[Hive] Parse error', e); }
    });

    ws.on('close', () => {
      // Remove peer
      for (const [id, socket] of this.peers.entries()) {
        if (socket === ws) {
          this.peers.delete(id);
          this.emit('peer:disconnected', id);
          break;
        }
      }
    });
  }

  handleMessage(ws, msg) {
    if (msg.type === 'handshake') {
      this.peers.set(msg.id, ws);
      console.log(`[Hive] Peered with ${msg.id.slice(0,8)}`);
      this.emit('peer:connected', msg.id);
    } else if (msg.type === 'gossip') {
      if (this.seenMessages.has(msg.mid)) return; // Ignore dupes
      this.seenMessages.add(msg.mid);
      
      this.emit('gossip', msg.payload);
      this.broadcast(msg.payload, msg.mid); // Re-broadcast (Gossip)
    }
  }

  broadcast(payload, mid = null) {
    const messageId = mid || crypto.randomUUID();
    this.seenMessages.add(messageId);
    
    const packet = JSON.stringify({
      type: 'gossip',
      mid: messageId,
      source: this.id,
      payload
    });

    for (const ws of this.peers.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(packet);
      }
    }
  }
}
