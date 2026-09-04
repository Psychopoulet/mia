// deps

    // natives
    import { createServer } from "node:http";
    import { join } from "node:path";

    // externals
    import compression from "compression";
    import cors from "cors";
    import express from "express";
    import helmet from "helmet";
    import { formateError, NotFoundError } from "node-pluginsmanager-plugin";
    import { WebSocketServer } from "ws";

    // locals

    import getRequestPath from "./getRequestPath";

    import authorization from "../../api/authorization";

// types & interfaces

    // natives
    import type { Server } from "node:http";

    // externals
    import type { Express, Request, Response, NextFunction } from "express";
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { iFormattedError } from "node-pluginsmanager-plugin";
    import type { WebSocket } from "ws";

    // locals
    import type { iLogger } from "./generateLogger";

// consts

    const PUBLIC_DIRECTORY: string = join(__dirname, "..", "..", "..", "..", "public");
    const LIBS_DIRECTORY: string = join(__dirname, "..", "..", "..", "..", "node_modules");

// module

export default function generateServer (container: ContainerPattern): Promise<void> {

    return Promise.resolve().then((): Promise<void> => {

        return new Promise((resolve: () => void): void => {

            // create app

            const app: Express = express()
                .use(cors())
                .use(helmet({
                    "contentSecurityPolicy": false
                }))
                .use(compression())
                .use(express.json());

            // authorization

            app.use((req: Request, res: Response, next: NextFunction): void => {
                authorization(container, req, res, next);
            });

            // public paths

                // main page

                    app.get([ "/", "/public/index.html" ], (req: Request, res: Response): void => {
                        res.redirect(301, "/mia-core/public/index.html");
                    }).get("/public/menu.min.js", (req: Request, res: Response): void => {
                        return res.sendFile(join(PUBLIC_DIRECTORY, "dist", "menu.min.js"));
                    }).get("/public/menu.min.js.map", (req: Request, res: Response): void => {
                        return res.sendFile(join(PUBLIC_DIRECTORY, "dist", "menu.min.js.map"));
                    });

                // libs

                    // bootstrap

                        // css

                        app.get("/public/libs/bootstrap.min.css", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "bootstrap", "dist", "css", "bootstrap.min.css"));
                        }).get("/public/libs/bootstrap.min.css.map", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "bootstrap", "dist", "css", "bootstrap.min.css.map"));
                        })

                        // js

                        .get("/public/libs/bootstrap.min.js", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "bootstrap", "dist", "js", "bootstrap.min.js"));
                        }).get("/public/libs/bootstrap.min.js.map", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "bootstrap", "dist", "js", "bootstrap.min.js.map"));
                        })

                    // fontawesome

                        // css

                        .get("/public/libs/fontawesome.min.css", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "css", "all.min.css"));
                        })

                        // webfonts

                        .get("/public/webfonts/fa-brands-400.ttf", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.ttf"));
                        }).get("/public/webfonts/fa-brands-400.woff2", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-brands-400.woff2"));
                        }).get("/public/webfonts/fa-regular-400.ttf", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.ttf"));
                        }).get("/public/webfonts/fa-regular-400.woff2", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-regular-400.woff2"));
                        }).get("/public/webfonts/fa-solid-900.ttf", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.ttf"));
                        }).get("/public/webfonts/fa-solid-900.woff2", (req: Request, res: Response): void => {
                            return res.sendFile(join(LIBS_DIRECTORY, "@fortawesome", "fontawesome-free", "webfonts", "fa-solid-900.woff2"));
                        });

                // pictures

                    app.get([
                        "favicon.ico",
                        "/favicon.ico",
                        "/public/pictures/favicon.ico"
                    ], (req: Request, res: Response): void => {

                        return res.sendFile(join(PUBLIC_DIRECTORY, "pictures", "favicon.ico"));

                    }).get([
                        "favicon.png",
                        "/favicon.png",
                        "/public/pictures/favicon.png"
                    ], (req: Request, res: Response): void => {

                        return res.sendFile(join(PUBLIC_DIRECTORY, "pictures", "favicon.png"));

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

                const error = formateError(new NotFoundError(getRequestPath(container, req) + " not found"));

                res.status(error.httpCode).json({
                    "code": error.code,
                    "message": error.message
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

                const formattedError: iFormattedError = formateError(err as Error);

                res.status(formattedError.httpCode).json({
                    "code": formattedError.code,
                    "message": formattedError.message
                });

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

            // register server socket

            container.set("server-socket", wss);

            // link socket to plugins

            container.get<Pluginsmanager>("plugins-manager").socketMiddleware(wss);

            // run http server

            server.listen(container.get<ConfManager>("conf").get<number>("port"), (): void => {

                container.get<iLogger>("log").success("started on port " + container.get<ConfManager>("conf").get<number>("port"));

                resolve();

            });

        });

    });

}
