// types & interfaces

    // externals
    import type { Orchestrator } from "node-pluginsmanager-plugin";
    import type PluginsManager from "node-pluginsmanager";

// module

export default function findPluginByName (pluginsManager: PluginsManager, name: string): Orchestrator | undefined {

    return pluginsManager.plugins.find((plugin: Orchestrator): boolean => {
        return plugin.name === name;
    });

}
