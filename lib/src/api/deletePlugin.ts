// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

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
    import type { components, operations } from "./Descriptor";

// module

export default function deletePlugin (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const urlParamsPath: operations["deletePlugin"]["parameters"]["path"] = req.params as unknown as operations["deletePlugin"]["parameters"]["path"];

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

    Promise.resolve().then((): Promise<string> => {

        const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
            return p.name === urlParamsPath.name;
        });

        if (!plugin) {
            throw new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found");
        }

        const command: components["schemas"]["PushEventPluginUninstallRunning"]["command"] = "plugin-uninstall-running";
        const data: components["schemas"]["PushEventPluginUninstallRunning"]["data"] = plugin.name;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return pluginsManager.uninstall(plugin);

    }).then((pluginName: string): Response => {

        const command: components["schemas"]["PushEventPluginUninstallSuccess"]["command"] = "plugin-uninstall-success";
        const data: components["schemas"]["PushEventPluginUninstallSuccess"]["data"] = pluginName;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return res.status(204).json();

    }).catch((err: Error): void => {

        const command: components["schemas"]["PushEventPluginUninstallFail"]["command"] = "plugin-uninstall-fail";
        const data: components["schemas"]["PushEventPluginUninstallFail"]["data"] = {
            "pluginName": urlParamsPath.name,
            "error": err.message
        };

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        return next(err);

    });

}
