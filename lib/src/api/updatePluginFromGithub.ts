// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function updatePluginFromGithub (
    container: ContainerPattern,
    urlParamsPath: operations["updatePluginFromGithub"]["parameters"]["path"]
): Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]> {

    if ("undefined" === typeof urlParamsPath) {
        return Promise.reject(new ReferenceError("Missing urlParamsPath"));
    }
    else if ("object" !== typeof urlParamsPath) {
        return Promise.reject(new TypeError("urlParamsPath is not an object"));
    }
    else if (null === urlParamsPath as unknown) { // had to force type to avoid lint error
        return Promise.reject(new ReferenceError("urlParamsPath is null"));
    }
        else if ("string" !== typeof urlParamsPath.name) {
            return Promise.reject(new TypeError("\"name\" in urlParamsPath is not a string"));
        }
        else if (0 >= urlParamsPath.name.trim().length) {
            return Promise.reject(new RangeError("\"name\" in urlParamsPath is empty"));
        }

    try {

        const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
            return p.name === urlParamsPath.name;
        });

        if (!plugin) {
            return Promise.reject(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found"));
        }

        return pluginsManager.updateViaGithub(plugin);

    }
    catch (err: unknown) {
        return Promise.reject(err);
    }

}
