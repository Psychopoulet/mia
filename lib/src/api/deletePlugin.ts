/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

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

        return pluginsManager.uninstall(plugin, container);

    }).then((pluginName: string): Response => {

        const command: components["schemas"]["PushEventPluginUninstallSuccess"]["command"] = "plugin-uninstall-success";
        const data: components["schemas"]["PushEventPluginUninstallSuccess"]["data"] = pluginName;

        socketPush(container.get<WebSocketServer>("server-socket"), command, data);

        const httpCode: keyof operations["deletePlugin"]["responses"] = 204;

        return res.status(httpCode).json();

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
