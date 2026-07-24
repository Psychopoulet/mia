// deps

    // locals
    import socketPush from "../tools/socketPush";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Server as WebSocketServer } from "ws";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { operations, components } from "./Descriptor";

    interface iGithubRepository {
        "user": string;
        "repo": string;
    }

// private

    function _parseGithubPath (github: string): iGithubRepository {

        const path: string = github.trim().replace(/\.git$/u, "");
        const urlMatch: RegExpExecArray | null = /github\.com[/:]([^/]+)\/([^/]+)/u.exec(path);
        const shortMatch: RegExpExecArray | null = /^github:([^/]+)\/([^/]+)$/u.exec(path);
        const match: RegExpExecArray | null = urlMatch ?? shortMatch;

        if (match) {

            return {
                "user": match[1],
                "repo": match[2]
            };

        }

        const parts: string[] = path.split("/").filter(Boolean);

        if (2 <= parts.length) {

            return {
                "user": parts[parts.length - 2],
                "repo": parts[parts.length - 1]
            };

        }

        throw new Error("Invalid GitHub repository path");

    }

// module

export default function installPluginFromGithub (container: ContainerPattern, req: Request, res: Response, next: NextFunction): Response | void {

    const body: operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"] = req.body as operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"];

    if ("undefined" === typeof body) {
        return next(new ReferenceError("Missing body"));
    }
    else if ("object" !== typeof body) {
        return next(new TypeError("Body is not an object"));
    }
    else if (null === body as unknown) { // had to force type to avoid lint error
        return next(new ReferenceError("Body is null"));
    }
        else if ("undefined" === typeof body.path) {
            return next(new ReferenceError("Missing \"path\" in body"));
        }
        else if ("string" !== typeof body.path) {
            return next(new TypeError("\"path\" in body is not a string"));
        }
        else if (0 >= body.path.trim().length) {
            return next(new RangeError("\"path\" in body is empty"));
        }

    Promise.resolve().then((): iGithubRepository => {

        return _parseGithubPath(body.path);

    }).then(({ user, repo }: iGithubRepository): Promise<Orchestrator> => {

        const command: components["schemas"]["PushEventPluginInstallRunning"]["command"] = "plugin-install-running";
        const data: components["schemas"]["PushEventPluginInstallRunning"]["data"] = repo;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return container.get<Pluginsmanager>("plugins-manager").installViaGithub(user, repo, container);

    }).then((plugin: Orchestrator): Response => {

        const command: components["schemas"]["PushEventPluginInstallSuccess"]["command"] = "plugin-install-success";
        const data: components["schemas"]["PushEventPluginInstallSuccess"]["data"] = plugin.name;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return res.status(201).json();

    }).catch((err: Error): void => {

        const command: components["schemas"]["PushEventPluginInstallFail"]["command"] = "plugin-install-fail";
        const data: components["schemas"]["PushEventPluginInstallFail"]["data"] = {
            "pluginName": body.path,
            "error": err.message
        };

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return next(err);

    });

}
