// deps

    // natives
    import { randomBytes } from "node:crypto";
    import { readFile, writeFile } from "node:fs/promises";
    import { createServer } from "node:http";
    import { join } from "node:path";

    // externals
    import compression from "compression";
    import cors from "cors";
    import express from "express";
    import helmet from "helmet";
    import { isFile, formateError, NotFoundError } from "node-pluginsmanager-plugin";
    import { WebSocketServer } from "ws";

    // locals

    import getRequestPath from "./getRequestPath";
    import socketPush from "../socketPush";

    import authorization from "../../api/authorization";

    import login from "../../api/login";
    import logout from "../../api/logout";
    import getDescriptor from "../../api/getDescriptor";
    import getPlugins from "../../api/getPlugins";
    import installPluginFromGithub from "../../api/installPluginFromGithub";
    import updatePluginFromGithub from "../../api/updatePluginFromGithub";
    import deletePlugin from "../../api/deletePlugin";
    import getPluginLatestTag from "../../api/getPluginLatestTag";

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
    import type { components } from "../../api/Descriptor";

// module

export default function generateServer (container: ContainerPattern): Promise<void> {

    return Promise.resolve().then(async (): Promise<void> => {

        // generate server key

        // if server key is already set, return
        if (container.has("server-key")) {
            return Promise.resolve();
        }

        const file: string = join(container.get<string>("data-directory"), ".server-key");

        // if server key file does not exist, create it
        if (!await isFile(file)) {
            await writeFile(file, randomBytes(64).toString("hex"), "utf-8");
        }

        return readFile(file, "utf-8").then((key: string): void => {
            container.set("server-key", key);
        });

    }).then(() => {

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

                app.get([ "/", "/public/index.html" ], (req: Request, res: Response, next: NextFunction): void => {

                    const file: string = join(__dirname, "..", "..", "..", "public", "index.html");

                    readFile(file, "utf-8").then((content: string): void => {

                        res.status(200).send(content
                            .replace(/{{app.name}}/g, container.get<string>("app.name"))
                            .replace(/{{app.version}}/g, container.get<string>("app.version"))
                            .replace(/{{app.description}}/g, container.get<string>("app.description"))
                        );

                    }).catch((err: Error): void => {
                        next(err);
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

            // no authorization required

            app.put("/api/auth", (req: Request, res: Response, next: NextFunction): void => {
                login(container, req, res, next);
            }).delete("/api/auth", (req: Request, res: Response, next: NextFunction): void => {
                logout(container, req, res, next);
            });

            // authorization required

            app.get("/api/descriptor", getDescriptor).get("/api/plugins", (req: Request, res: Response, next: NextFunction): void => {
                getPlugins(container, req, res, next);
            }).put("/api/plugins", (req: Request, res: Response, next: NextFunction): void => {
                installPluginFromGithub(container, req, res, next);
            }).post("/api/plugins/:name", (req: Request, res: Response, next: NextFunction): void => {
                updatePluginFromGithub(container, req, res, next);
            }).delete("/api/plugins/:name", (req: Request, res: Response, next: NextFunction): void => {
                deletePlugin(container, req, res, next);
            }).get("/api/plugins/:name/latest-tag", (req: Request, res: Response, next: NextFunction): void => {
                getPluginLatestTag(container, req, res, next);
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

        // register plugins manager events

        container.get<Pluginsmanager>("plugins-manager").on("installing", (pluginName: string, currentStep: number, maxSteps: number, stepMessage: string): void => {

            const command: components["schemas"]["PushEventPluginInstallStep"]["command"] = "plugin-install-step";
            const data: components["schemas"]["PushEventPluginInstallStep"]["data"] = {
                pluginName,
                currentStep,
                maxSteps,
                stepMessage
            };

            socketPush(wss, command, data);

        }).on("updating", (pluginName: string, currentStep: number, maxSteps: number, stepMessage: string): void => {

            const command: components["schemas"]["PushEventPluginUpdateStep"]["command"] = "plugin-update-step";
            const data: components["schemas"]["PushEventPluginUpdateStep"]["data"] = {
                pluginName,
                currentStep,
                maxSteps,
                stepMessage
            };

            socketPush(wss, command, data);

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
