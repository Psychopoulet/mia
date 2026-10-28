// deps

    // natives
    const http = require("node:http");
    const { mkdir, mkdtemp, rm, writeFile } = require("node:fs/promises");
    const os = require("node:os");
    const { join } = require("node:path");
    const { strictEqual } = require("node:assert");

    // externals
    const { WebSocket } = require("ws");

    // locals
    const startApplication = require("../lib/src/main.cts").default;
    const User = require("../lib/src/tools/models/User.ts").default;

// consts

    const PATHS = [
        "/",
        "/public/index.html",
        "/public/menu.min.js",
        "/public/menu.min.js.map",
        "/public/libs/bootstrap.min.css",
        "/public/libs/bootstrap.min.css.map",
        "/public/libs/bootstrap.min.js",
        "/public/libs/bootstrap.min.js.map",
        "/public/libs/fontawesome.min.css",
        "/public/webfonts/fa-brands-400.ttf",
        "/public/webfonts/fa-brands-400.woff2",
        "/public/webfonts/fa-regular-400.ttf",
        "/public/webfonts/fa-regular-400.woff2",
        "/public/webfonts/fa-solid-900.ttf",
        "/public/webfonts/fa-solid-900.woff2",
        "/favicon.ico",
        "/favicon.png",
        "/public/pictures/favicon.ico",
        "/public/pictures/favicon.png",
        "/mia-core/api/missing",
        "/public/not-real"
    ];

// private

    function _request (port, path) {

        return new Promise((resolve, reject) => {

            const req = http.get({
                "hostname": "127.0.0.1",
                "path": path,
                "port": port
            }, (res) => {

                res.resume();
                res.on("end", () => {
                    resolve(res.statusCode);
                });

            });

            req.on("error", reject);

        });

    }

    function _port () {

        const handles = process._getActiveHandles();

        for (const handle of handles) {

            if (handle && "function" === typeof handle.address && handle.listening) {

                const address = handle.address();

                if (address && "number" === typeof address.port && 0 < address.port) {
                    return address.port;
                }

            }

        }

        return 0;

    }

    function _shutdown () {

        const handles = process._getActiveHandles();
        const closing = [];

        if (User.sequelize) {

            closing.push(User.sequelize.close().catch(() => {
                return null;
            }));

        }

        handles.forEach((handle) => {

            const name = handle && handle.constructor ? handle.constructor.name : "";

            if ("Server" === name || "WebSocketServer" === name) {

                if ("function" === typeof handle.closeAllConnections) {
                    handle.closeAllConnections();
                }

                closing.push(new Promise((resolve) => {
                    handle.close(resolve);
                }));

            }

        });

        return Promise.all(closing);

    }

    function _wait (exitState) {

        return new Promise((resolve, reject) => {

            const started = Date.now();

            const timer = setInterval(() => {

                if (null !== exitState.code) {

                    clearInterval(timer);
                    resolve();

                }
                else if (10000 < Date.now() - started) {

                    clearInterval(timer);
                    reject(new Error("shutdown timed out"));

                }

            }, 20);

        });

    }

describe("application boot", () => {

    const originalHomedir = os.homedir;
    const originalExit = process.exit;
    const exitState = {
        "code": null
    };
    let root = "";

    before(() => {

        process.exit = (code) => {
            exitState.code = code;
        };

    });

    after(async () => {

        os.homedir = originalHomedir;
        process.exit = originalExit;

        await _shutdown();

        if (root) {
            await rm(root, {
                "force": true,
                "recursive": true
            });
        }

    });

    it("should boot in a temporary home and serve public routes", async () => {

        root = await mkdtemp(join(os.tmpdir(), "mia-boot-"));

        const dataDir = join(root, "mia", "data");

        await mkdir(dataDir, {
            "recursive": true
        });
        await mkdir(join(root, "mia", "plugins"), {
            "recursive": true
        });
        const dbFile = join(dataDir, "from-uri.db");

        await writeFile(join(dataDir, ".env"), "port=0\ndatabase-uri=sqlite:" + dbFile + "\n", "utf-8");

        os.homedir = () => {
            return root;
        };

        await startApplication();

        const port = _port();

        strictEqual(0 < port, true);

        await PATHS.reduce((chain, path) => {

            return chain.then(() => {
                return _request(port, path);
            });

        }, Promise.resolve());

        const socket = new WebSocket("ws://127.0.0.1:" + String(port));

        await new Promise((resolve, reject) => {

            socket.once("open", resolve);
            socket.once("error", reject);

        });

        const socketServer = process._getActiveHandles().find((handle) => {
            return Boolean(handle && handle.clients && "function" === typeof handle.emit);
        });

        if (socketServer) {

            socketServer.emit("error", new Error("listener down"));

            const clients = [ ...socketServer.clients ];

            if (0 < clients.length) {

                const [ client ] = clients;

                client.emit("error", new Error("client down"));
                client.emit("close", 0, Buffer.alloc(0));
                client.emit("close", 4000, Buffer.alloc(0));

            }

        }

        socket.close(1000, "bye");

        await new Promise((resolve) => {
            socket.once("close", resolve);
        });

        process.emit("SIGINT");
        await _wait(exitState);
        strictEqual(exitState.code, 0);

    }).timeout(60000);

});
