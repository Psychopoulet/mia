// deps

    // natives
    import { readFile } from "node:fs";
    import { createServer } from "node:http";
    import { join } from "node:path";

    // externals
    import compression from "compression";
    import cors from "cors";
    import express from "express";
    import helmet from "helmet";
    import { WebSocketServer } from "ws";

    import { UnauthorizedError, NotFoundError, LockedError } from "node-pluginsmanager-plugin";

    // locals
    import getRequestPath from "./getRequestPath";
    import getPlugins from "../api/getPlugins";
    import installPlugin from "../api/installPlugin";

// types & interfaces

    // natives
    import type { Server } from "node:http";

    // externals
    import type { Express, Request, Response, NextFunction } from "express";
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { WebSocket } from "ws";

    // locals
    import type { iLogger } from "./generateLogger";
    import type { operations } from "../api/Descriptor";

// module

export default function generateServer (container: ContainerPattern): Promise<void> {

    return new Promise((resolve: () => void): void => {

        // create app

        const app: Express = express()
            .use(cors())
            .use(helmet({
                "contentSecurityPolicy": false
            }))
            .use(compression())
            .use(express.json());

        // basic roots

        app.get([ "/", "/public/index.html" ], (req: Request, res: Response, next: NextFunction): void => {

            const file: string = join(__dirname, "..", "..", "..", "public", "index.html");

            readFile(file, "utf-8", (err: Error | null, content: string): void => {

                if (err) {
                    next(err);
                    return;
                }

                res.status(200).send(content
                    .replace(/{{app.name}}/g, container.get<string>("app.name"))
                    .replace(/{{app.version}}/g, container.get<string>("app.version"))
                    .replace(/{{app.description}}/g, container.get<string>("app.description"))
                );

            });

        }).get("/public/menu.min.js", (req: Request, res: Response): void => {
            return res.sendFile(join(__dirname, "..", "..", "..", "public", "dist", "menu.min.js"));
        }).get("/public/menu.min.js.map", (req: Request, res: Response): void => {
            return res.sendFile(join(__dirname, "..", "..", "..", "public", "dist", "menu.min.js.map"));
        }).get("/public/bundle.min.js", (req: Request, res: Response): void => {
            return res.sendFile(join(__dirname, "..", "..", "..", "public", "dist", "bundle.min.js"));
        }).get("/public/bundle.min.js.map", (req: Request, res: Response): void => {
            return res.sendFile(join(__dirname, "..", "..", "..", "public", "dist", "bundle.min.js.map"));
        });

        // libs

            // bootstrap

                // css

                app.get("/public/libs/bootstrap.min.css", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css"));
                }).get("/public/libs/bootstrap.min.css.map", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "css", "bootstrap.min.css.map"));
                })

                // js

                .get("/public/libs/bootstrap.min.js", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "js", "bootstrap.min.js"));
                }).get("/public/libs/bootstrap.min.js.map", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "bootstrap", "dist", "js", "bootstrap.min.js.map"));
                })

            // fontawesome

                // css

                .get("/public/libs/fontawesome.min.css", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "css", "all.min.css"));
                })

                // webfonts

                .get("/public/webfonts/fa-brands-400.ttf", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.ttf"));
                }).get("/public/webfonts/fa-brands-400.woff2", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.woff2"));
                }).get("/public/webfonts/fa-regular-400.ttf", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.ttf"));
                }).get("/public/webfonts/fa-regular-400.woff2", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.woff2"));
                }).get("/public/webfonts/fa-solid-900.ttf", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.ttf"));
                }).get("/public/webfonts/fa-solid-900.woff2", (req: Request, res: Response): void => {
                    return res.sendFile(join(__dirname, "..", "..", "..", "node_modules", "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.woff2"));
                });

        // pictures

        app.get([
            "favicon.ico",
            "/favicon.ico",
            "/public/pictures/favicon.ico"
        ], (req: Request, res: Response): void => {

            return res.sendFile(join(__dirname, "..", "..", "..", "public", "pictures", "favicon.ico"));

        }).get([
            "favicon.png",
            "/favicon.png",
            "/public/pictures/favicon.png"
        ], (req: Request, res: Response): void => {

            return res.sendFile(join(__dirname, "..", "..", "..", "public", "pictures", "favicon.png"));

        });

        // api

        app.get("/api/plugins", (req: Request, res: Response): void => {
            res.json(getPlugins(container));
        }).put("/api/plugins", (req: Request, res: Response, next: NextFunction): void => {

            installPlugin(container, req.body as operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"]).then((data: operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]): void => {
                res.json(data);
            }).catch((err: Error): void => {
                next(err);
            });

        });

        // link request to plugins

        app.use((req: Request, res: Response, next: NextFunction): void => {
            container.get<Pluginsmanager>("plugins-manager").appMiddleware(req, res, next);
        });

        // not found

        app.use((req: Request, res: Response, next: NextFunction): void => {

            container.get<iLogger>("log").warning(getRequestPath(container, req) + " not found");

            if (res.headersSent) {
                next(new Error(getRequestPath(container, req) + " not found"));
                return;
            }

            res.status(404).json({
                "code": 404,
                "message": getRequestPath(container, req) + " not found"
            });

        });

        // error

        app.use((err: unknown, req: Request, res: Response, next: NextFunction): void => {

            const msg: string = err instanceof Error ? err.message : String(err);

            container.get<iLogger>("log").error(getRequestPath(container, req) + " " + msg);
            if (err instanceof Error && "string" === typeof err.stack) {
                container.get<iLogger>("log").debug(err.stack);
            }

            if (res.headersSent) {
                next(err);
                return;
            }

            if (err instanceof ReferenceError) {

                res.status(400).json({
                    "code": "MISSING_PARAMETER",
                    "message": msg
                });

            }
            else if (err instanceof TypeError) {

                res.status(400).json({
                    "code": "WRONG_TYPE_PARAMETER",
                    "message": msg
                });

            }
            else if (err instanceof RangeError) {

                res.status(400).json({
                    "code": "EMPTY_OR_RANGE_OR_ENUM_PARAMETER",
                    "message": msg
                });

            }
            else if (err instanceof SyntaxError) {

                res.status(400).json({
                    "code": "JSON_PARSE",
                    "message": msg
                });

            }
            else if (err instanceof UnauthorizedError) {

                res.status(401).json({
                    "code": "UNAUTHORIZED",
                    "message": msg
                });

            }
            else if (err instanceof NotFoundError) {

                res.status(404).json({
                    "code": "NOT_FOUND",
                    "message": msg
                });

            }
            else if (err instanceof LockedError) {

                res.status(423).json({
                    "code": "LOCKED",
                    "message": msg
                });

            }

            else {

                res.status(500).json({
                    "code": 500,
                    "message": "Internal server error"
                });

            }

        });

        // create http server

        const server: Server = createServer(app);

        // create socket server

        const wss: WebSocketServer = new WebSocketServer({
            "server": server
        });

        wss.on("error", (err: Error): void => {
            container.get<iLogger>("log").error(err.message);
        }).on("connection", (ws: WebSocket): void => {

            container.get<iLogger>("log").debug("Socket created");

            ws.on("error", (err: Error): void => {
                container.get<iLogger>("log").warning(err.message);
            });

            ws.on("close", (code: number, reason: Buffer): void => {

                if (code) {

                    if (reason.length) {
                        container.get<iLogger>("log").info("Socket closed with code " + code + " (reason : " + reason.toString("utf-8") + ")");
                    }
                    else {
                        container.get<iLogger>("log").info("Socket closed with code " + code);
                    }

                }
                else {
                    container.get<iLogger>("log").debug("Socket closed");
                }

            });

        });

        // link socket to plugins

        container.get<Pluginsmanager>("plugins-manager").socketMiddleware(wss);

        // run http server

        server.listen(container.get<ConfManager>("conf").get<number>("port"), (): void => {

            container.get<iLogger>("log").success("started on port " + container.get<ConfManager>("conf").get<number>("port"));

            resolve();

        });

    });

}
