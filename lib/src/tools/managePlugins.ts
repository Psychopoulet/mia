// deps

    // externals
    import Pluginsmanager from "node-pluginsmanager";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";
    import type { Orchestrator, tLogType } from "node-pluginsmanager-plugin";

    // locals
    import type { iLogger } from "./generateLogger";

// module

export default function managePlugins (container: ContainerPattern): Promise<void> {

    const logger: iLogger = container.get("log") as iLogger;

    const pluginsManager: Pluginsmanager = new Pluginsmanager({
        "directory": container.get("plugins-directory") as string,
        "externalRessourcesDirectory": container.get("data-directory") as string,
        "logger": (type: tLogType, message: string | Error): void => {

            const msg: string = (message as Error).message ? (message as Error).message : message as string;

            switch (type) {

                case "info":
                    return logger.info(msg);

                case "success":
                    return logger.success(msg);

                case "warning":
                    return logger.warning(msg);

                case "error":
                    return logger.error(msg);

                // "data"
                // "debug"
                // "log"
                default:
                    return logger.debug(msg);

            }

        }
    });

        container
            .set("plugins-manager", pluginsManager)
            .document("plugins-manager", "The application's plugin manager (instance of 'node-pluginsmanager' package)");

        pluginsManager.on("error", (err: Error): void => {
            logger.error(err.message);
            logger.debug(err.stack as string);
        })

        .on("loaded", (plugin: Orchestrator): void => {
            logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") loaded");
        }).on("allloaded", (): void => {
            logger.success("All plugins loaded");
        })

        .on("initialized", (plugin: Orchestrator): void => {
            logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") initialized");
        }).on("allinitialized", (): void => {
            logger.success("All plugins initialized");
        })

        .on("released", (plugin: Orchestrator): void => {
            logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") released");
        }).on("allreleased", (): void => {
            logger.warning("All plugins released");
        })

        .on("destroyed", (pluginName: string): void => {
            logger.warning("Plugin " + pluginName + " destroyed");
        }).on("alldestroyed", (): void => {
            logger.warning("All plugins destroyed");
        })

        .on("updated", (plugin: Orchestrator): void => {
            logger.success("Plugin " + plugin.name + " (v" + plugin.version + ") success");
        })

        .on("installed", (plugin: Orchestrator): void => {
            logger.success("Plugin " + plugin.name + " (v" + plugin.version + ") installed");
        }).on("uninstalled", (plugin: Orchestrator): void => {
            logger.warning("Plugin " + plugin.name + " (v" + plugin.version + ") uninstalled");
        });

    return pluginsManager.loadAll(container).then((): Promise<void> => {
        return pluginsManager.initAll(container);
    });

}
