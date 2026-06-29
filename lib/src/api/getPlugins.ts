// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { components } from "./Descriptor";

// module

export default function getPlugins (
    container: ContainerPattern
): Array<components["schemas"]["Plugin"]> {

    return container.get<Pluginsmanager>("plugins-manager").plugins.map((plugin: Orchestrator): components["schemas"]["Plugin"] => {

        return {
            "name": plugin.name,
            "version": plugin.version,
            "description": plugin.description,
            "enabled": plugin.enabled,
            "dependencies": plugin.dependencies as Record<string, string>,
            "engines": plugin.engines as Record<string, string>,
            "authors": plugin.authors,
            "license": plugin.license
        };

    });

}
