// deps

    // natives
    const http = require("node:http");

    // externals
    const { WebSocketServer } = require("ws");

// module

// Bun leaves process._getActiveHandles() empty, even while an HTTP server is listening.
// The boot test reads this list for the real bound port (the config port stays 0) and to close the servers.
const handles = new Set();
const originalHandles = process._getActiveHandles;
const originalListen = http.Server.prototype.listen;
const OriginalWebSocketServer = WebSocketServer;

// createServer() itself does not register the server. listen() does, including servers opened after this file.
http.Server.prototype.listen = function listen (...args) {

    handles.add(this);
    this.on("close", () => {
        handles.delete(this);
    });

    return originalListen.apply(this, args);

};

// The socket server is built with `new WebSocketServer`, which never calls http.Server.listen.
// The wrapper has to replace the export before the application imports ws, otherwise the app keeps the original class.
function TrackedWebSocketServer (...args) {

    const server = new OriginalWebSocketServer(...args);

    handles.add(server);
    server.on("close", () => {
        handles.delete(server);
    });

    return server;

}

TrackedWebSocketServer.prototype = OriginalWebSocketServer.prototype;
Object.setPrototypeOf(TrackedWebSocketServer, OriginalWebSocketServer);
require("ws").WebSocketServer = TrackedWebSocketServer;

process._getActiveHandles = () => {

    const native = "function" === typeof originalHandles ? originalHandles.call(process) : [];

    return [ ...native, ...handles ];

};
