import React from 'react';

function makePeerId() {
    return `peer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCollabRoom(roomId: string) {
    const safeRoom = String(roomId || '').trim() || 'default';
    const [connected, setConnected] = React.useState(false);
    const [peerId] = React.useState(() => makePeerId());
    const [remoteCursors, setRemoteCursors] = React.useState<Record<string, { x: number; y: number; updatedAt: string }>>({});
    const [lastEvent, setLastEvent] = React.useState<{ eventType: string; payload: any; fromPeerId: string } | null>(null);
    const socketRef = React.useRef<WebSocket | null>(null);

    React.useEffect(() => {
        let disposed = false;
        let reconnectTimer: number | null = null;

        const cleanupSocket = () => {
            if (socketRef.current) {
                try {
                    socketRef.current.close();
                } catch {
                    // ignore
                }
                socketRef.current = null;
            }
        };

        const connect = async () => {
            try {
                const status = await window.api.collab.getStatus();
                if (disposed) return;
                const host = String(status && status.host ? status.host : '127.0.0.1');
                const port = Number(status && status.port ? status.port : 55116);
                const ws = new WebSocket(`ws://${host}:${port}`);
                socketRef.current = ws;

                ws.onopen = () => {
                    if (disposed) return;
                    setConnected(true);
                    ws.send(JSON.stringify({
                        action: 'join',
                        room: safeRoom,
                        peerId,
                    }));
                };

                ws.onclose = () => {
                    if (disposed) return;
                    setConnected(false);
                    if (reconnectTimer == null) {
                        reconnectTimer = window.setTimeout(() => {
                            reconnectTimer = null;
                            connect();
                        }, 1200);
                    }
                };

                ws.onmessage = (event) => {
                    let parsed: any = null;
                    try {
                        parsed = JSON.parse(String(event.data || ''));
                    } catch {
                        return;
                    }
                    if (!parsed || typeof parsed !== 'object') return;
                    if (parsed.action !== 'event') return;
                    const eventType = String(parsed.eventType || '');
                    const sender = String(parsed.fromPeerId || '');
                    const payload = parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : {};
                    if (eventType === 'cursor') {
                        const x = Number(payload.x || 0);
                        const y = Number(payload.y || 0);
                        setRemoteCursors((prev) => ({
                            ...prev,
                            [sender]: {
                                x,
                                y,
                                updatedAt: new Date().toISOString(),
                            },
                        }));
                    }
                    setLastEvent({
                        eventType,
                        payload,
                        fromPeerId: sender,
                    });
                };
            } catch {
                if (disposed) return;
                setConnected(false);
                if (reconnectTimer == null) {
                    reconnectTimer = window.setTimeout(() => {
                        reconnectTimer = null;
                        connect();
                    }, 1200);
                }
            }
        };

        connect();

        return () => {
            disposed = true;
            if (reconnectTimer != null) {
                window.clearTimeout(reconnectTimer);
            }
            cleanupSocket();
        };
    }, [peerId, safeRoom]);

    const publish = React.useCallback((eventType: string, payload: Record<string, any>) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return false;
        socketRef.current.send(JSON.stringify({
            action: 'publish',
            room: safeRoom,
            eventType: String(eventType || ''),
            payload: payload && typeof payload === 'object' ? payload : {},
        }));
        return true;
    }, [safeRoom]);

    return {
        connected,
        peerId,
        roomId: safeRoom,
        remoteCursors,
        lastEvent,
        publish,
    };
}

export default useCollabRoom;

