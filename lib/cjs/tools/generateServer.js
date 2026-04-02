"use strict";
// deps
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateServer;
// natives
const node_fs_1 = require("node:fs");
const node_http_1 = require("node:http");
const node_path_1 = require("node:path");
// externals
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const ws_1 = require("ws");
// locals
const getRequestPath_1 = __importDefault(require("./getRequestPath"));
// module
function generateServer(container) {
    return new Promise((resolve) => {
        // create app
        const app = (0, express_1.default)()
            .use((0, cors_1.default)())
            .use((0, helmet_1.default)({
            "contentSecurityPolicy": false
        }))
            .use((0, compression_1.default)());
        // basic roots
        app.get(["/", "/public/index.html"], (req, res, next) => {
            const file = (0, node_path_1.join)(__dirname, "..", "..", "..", "public", "dist", "index.html");
            (0, node_fs_1.readFile)(file, "utf-8", (err, content) => {
                if (err) {
                    next(err);
                    return;
                }
                res.status(200).send(content
                    .replace(/{{app.name}}/g, container.get("app.name"))
                    .replace(/{{app.version}}/g, container.get("app.version"))
                    .replace(/{{app.description}}/g, container.get("app.description")));
            });
        }).get("/public/bundle.js", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "public", "dist", "bundle.js"));
        });
        // libs
        // bootstrap
        // css
        app.get("/public/libs/bootstrap.min.css", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"));
        }).get("/public/libs/bootstrap.min.css.map", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css.map"));
        })
            // js
            .get("/public/libs/bootstrap.min.js", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "js", "bootstrap.min.js"));
        }).get("/public/libs/bootstrap.min.js.map", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "js", "bootstrap.min.js.map"));
        })
            // fontawesome
            // css
            .get("/public/libs/fontawesome.min.css", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "css", "all.min.css"));
        })
            // webfonts
            .get("/public/webfonts/fa-brands-400.ttf", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.ttf"));
        }).get("/public/webfonts/fa-brands-400.woff2", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.woff2"));
        }).get("/public/webfonts/fa-regular-400.ttf", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.ttf"));
        }).get("/public/webfonts/fa-regular-400.woff2", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.woff2"));
        }).get("/public/webfonts/fa-solid-900.ttf", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.ttf"));
        }).get("/public/webfonts/fa-solid-900.woff2", (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.woff2"));
        });
        // pictures
        app.get([
            "favicon.ico",
            "/favicon.ico",
            "/public/pictures/favicon.ico"
        ], (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "public", "dist", "pictures", "favicon.ico"));
        }).get([
            "favicon.png",
            "/favicon.png",
            "/public/pictures/favicon.png"
        ], (req, res) => {
            return res.sendFile((0, node_path_1.join)(__dirname, "..", "..", "..", "public", "dist", "pictures", "favicon.png"));
        });
        // link request to plugins
        app.use((req, res, next) => {
            container.get("plugins-manager").appMiddleware(req, res, next);
        });
        // not found
        app.use((req, res, next) => {
            container.get("log").warning((0, getRequestPath_1.default)(container, req) + " not found");
            if (res.headersSent) {
                next((0, getRequestPath_1.default)(container, req) + " not found");
                return;
            }
            res.status(404).json({
                "code": 404,
                "message": (0, getRequestPath_1.default)(container, req) + " not found"
            });
        });
        // create http server
        const server = (0, node_http_1.createServer)(app);
        // create socket server
        const wss = new ws_1.WebSocketServer({
            "server": server
        });
        wss.on("error", (err) => {
            container.get("log").error(err.message);
        }).on("connection", (ws) => {
            container.get("log").debug("Socket created");
            ws.on("error", (err) => {
                container.get("log").warning(err.message);
            });
            ws.on("close", (code, reason) => {
                if (code) {
                    if (reason.length) {
                        container.get("log").info("Socket closed with code " + code + " (reason : " + reason.toString("utf-8") + ")");
                    }
                    else {
                        container.get("log").info("Socket closed with code " + code);
                    }
                }
                else {
                    container.get("log").debug("Socket closed");
                }
            });
        });
        // link socket to plugins
        container.get("plugins-manager").socketMiddleware(wss);
        // run http server
        server.listen(container.get("conf").get("port"), () => {
            container.get("log").success("started on port " + container.get("conf").get("port"));
            resolve();
        });
    });
}
