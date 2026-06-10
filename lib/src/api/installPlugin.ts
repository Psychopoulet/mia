// deps

    // locals
    import socketPush from "../tools/socketPush";

// types & interfaces

    // externals
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

export default function installPlugin (container: ContainerPattern, body: operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"]): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> {

    if ("undefined" === typeof body) {
        return Promise.reject(new ReferenceError("Missing body"));
    }
    else if ("object" !== typeof body) {
        return Promise.reject(new TypeError("Body is not an object"));
    }
    else if (null === body as unknown) { // had to force type to avoid lint error
        return Promise.reject(new ReferenceError("Body is null"));
    }
    else if ("undefined" === typeof body.path) {
        return Promise.reject(new ReferenceError("Missing \"path\" in body"));
    }
    else if ("string" !== typeof body.path) {
        return Promise.reject(new TypeError("\"path\" in body is not a string"));
    }
    else if (0 >= body.path.trim().length) {
        return Promise.reject(new RangeError("\"path\" in body is empty"));
    }

    return Promise.resolve().then((): iGithubRepository => {

        return _parseGithubPath(body.path);

    }).then(({ user, repo }: iGithubRepository): Promise<Orchestrator> => {

        const command: components["schemas"]["PushEventPluginInstallRunning"]["command"] = "plugin-install-running";
        const data: components["schemas"]["PushEventPluginInstallRunning"]["data"] = repo;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return container.get<Pluginsmanager>("plugins-manager").installViaGithub(user, repo, container);

    }).then((plugin: Orchestrator): void => {

        const command: components["schemas"]["PushEventPluginInstallSuccess"]["command"] = "plugin-install-success";
        const data: components["schemas"]["PushEventPluginInstallSuccess"]["data"] = plugin.name;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

    }).catch((err: Error): Promise<Error> => {

        const command: components["schemas"]["PushEventPluginInstallFail"]["command"] = "plugin-install-fail";
        const data: components["schemas"]["PushEventPluginInstallFail"]["data"] = err.message;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return Promise.reject(err);

    });

}
