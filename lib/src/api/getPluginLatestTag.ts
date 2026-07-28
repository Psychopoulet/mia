/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function getPluginLatestTag (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const urlParamsPath: operations["getPluginLatestTag"]["parameters"]["path"] = req.params as operations["getPluginLatestTag"]["parameters"]["path"];

    const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
    const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
        return p.name === urlParamsPath.name;
    });

    if (!plugin) {
        return next(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found"));
    }

    pluginsManager.getLatestGithubTag(plugin).then((data: operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]): Response => {

        const httpCode: keyof operations["getPluginLatestTag"]["responses"] = 200;

        return res.status(httpCode).json(data);

    }).catch((err: Error): void => {
        return next(err);
    });

}
