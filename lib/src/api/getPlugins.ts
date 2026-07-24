// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { components, operations } from "./Descriptor";

// module

export default function getPlugins (container: ContainerPattern, req: Request, res: Response, next: NextFunction): Response | void {

    try {

        const data: operations["getPlugins"]["responses"]["200"]["content"]["application/json"] = container.get<Pluginsmanager>("plugins-manager").plugins.map((plugin: Orchestrator): components["schemas"]["Plugin"] => {

            return {
                "name": plugin.name,
                "version": plugin.version,
                "description": plugin.description,
                "enabled": plugin.enabled,
                "dependencies": plugin.dependencies as Record<string, string>,
                "engines": plugin.engines as Record<string, string>,
                "authors": plugin.authors,
                "license": plugin.license,
                "repository": plugin.repository
            };

        });

        return res.status(200).json(data);

    }
    catch (err: unknown) {
        return next(err);
    }

}
