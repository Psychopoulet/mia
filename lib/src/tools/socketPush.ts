// deps

    // natives
    import uniqid from "uniqid";

// types & interfaces

    // externals
    import type { Server as WebSocketServer, WebSocket } from "ws";

    interface iWebSocketWithId extends WebSocket {
        "id"?: string;
    }

// consts

    const WEBSOCKET_STATE_OPEN: number = 1;

// module

export default function socketPush (socket: WebSocketServer, command: string, data?: unknown): void {

    const result: Record<string, unknown> = {
        "id": uniqid(),
        "plugin": "core",
        "command": command
    };

    if ("undefined" !== typeof data) {
        result.data = data;
    }

    const formattedResult: string = JSON.stringify(result);

    return socket.clients.forEach((client: iWebSocketWithId): void => {

        client.id ??= uniqid();

        if (WEBSOCKET_STATE_OPEN === client.readyState) {

            client.send(formattedResult);

        }

    });

}
