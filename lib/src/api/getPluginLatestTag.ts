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

    try {

        const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
            return p.name === urlParamsPath.name;
        });

        if (!plugin) {
            return next(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found"));
        }

        pluginsManager.getLatestGithubTag(plugin).then((data: operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]): Response => {
            return res.status(200).json(data);
        }).catch((err: Error): void => {
            return next(err);
        });

    }
    catch (err: unknown) {
        return next(err);
    }

}
