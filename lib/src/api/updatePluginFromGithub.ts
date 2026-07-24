/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // locals
    import socketPush from "../tools/socketPush";

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Server as WebSocketServer } from "ws";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { operations, components } from "./Descriptor";

// module

export default function updatePluginFromGithub (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const urlParamsPath: operations["updatePluginFromGithub"]["parameters"]["path"] = req.params as unknown as operations["updatePluginFromGithub"]["parameters"]["path"];

    if ("undefined" === typeof urlParamsPath) {
        return next(new ReferenceError("Missing urlParamsPath"));
    }
    else if ("object" !== typeof urlParamsPath) {
        return next(new TypeError("urlParamsPath is not an object"));
    }
    else if (null === urlParamsPath as unknown) { // had to force type to avoid lint error
        return next(new ReferenceError("urlParamsPath is null"));
    }
        else if ("string" !== typeof urlParamsPath.name) {
            return next(new TypeError("\"name\" in urlParamsPath is not a string"));
        }
        else if (0 >= urlParamsPath.name.trim().length) {
            return next(new RangeError("\"name\" in urlParamsPath is empty"));
        }

    Promise.resolve().then((): Promise<Orchestrator> => {

        const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
            return p.name === urlParamsPath.name;
        });

        if (!plugin) {
            throw new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found");
        }

        const command: components["schemas"]["PushEventPluginUpdateRunning"]["command"] = "plugin-update-running";
        const data: components["schemas"]["PushEventPluginUpdateRunning"]["data"] = urlParamsPath.name;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return pluginsManager.updateViaGithub(plugin);

    }).then((): Response => {

        return res.status(204).json();

    }).catch((err: Error): void => {

        const command: components["schemas"]["PushEventPluginUpdateFail"]["command"] = "plugin-update-fail";
        const data: components["schemas"]["PushEventPluginUpdateFail"]["data"] = {
            "pluginName": urlParamsPath.name,
            "error": err.message
        };

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return next(err);

    });

}
