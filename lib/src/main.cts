/*
    eslint-disable n/no-process-exit
*/

// deps

    // externals
    import ContainerPattern from "node-containerpattern";

    // locals
    import registerAppData from "./tools/registerAppData";
    import ensureAppDirectories from "./tools/ensureAppDirectories";
    import generateConf from "./tools/generateConf";
    import generateLogger from "./tools/generateLogger";
    import managePlugins from "./tools/managePlugins";
    import generateServer from "./tools/generateServer";

// types & interfaces

    // externals
    import type Pluginsmanager from "node-pluginsmanager";

    // locals
    import type { iLogger } from "./tools/generateLogger";

// consts

    const container: ContainerPattern = new ContainerPattern();

// run

    // generate basic logger

    Promise.resolve().then((): void => {

        container
            .set("log", {
                "debug": console.debug,
                "info": console.info,
                "success": console.log,
                "warning": console.warn,
                "error": console.error
            })
            .document("log", "App logger");

    // register app data

    }).then((): Promise<void> => {

        return registerAppData(container);

    // ensure app directories

    }).then((): Promise<void> => {

        return ensureAppDirectories(container);

    // generate and load conf file

    }).then((): Promise<void> => {

        return generateConf(container);

    // generate advanced logger

    }).then((): void => {

        return generateLogger(container);

    // log basic data

    }).then((): void => {

        const log: iLogger = container.get("log") as iLogger;

        log.success((container.get("app.name") as string) + " (v" + (container.get("app.version") as string) + ")");
        log.debug("conf file : " + (container.get("conf-file") as string));
        log.debug("logs file : " + (container.get("logs-file") as string));

    // load plugins

    }).then((): Promise<void> => {

        return managePlugins(container);

    // create server

    }).then((): Promise<void> => {

        return generateServer(container);

    // catch
    }).then((): void => {

        process.on("SIGINT", (): void => {

            const pluginsManager: Pluginsmanager = container.get("plugins-manager") as Pluginsmanager;

            pluginsManager.releaseAll().then((): Promise<void> => {

                return pluginsManager.destroyAll();

            }).then((): void => {

                process.exit(0);

            }).catch((err: Error): void => {

                console.error("");
                console.error("Impossible to properly end the application");
                console.error(err);
                console.error("");

                process.exitCode = 1;
                process.exit(1);

            });

        });

    // fail to run
    }).catch((err: Error): void => {

        if (container.has("log")) {

            (container.get("log") as iLogger).error("Global script failed");
            (container.get("log") as iLogger).error(err.message);
            (container.get("log") as iLogger).debug(err.stack as string);

        }
        else {

            console.error("Global script failed");
            console.error(err);

        }

        process.exitCode = 1;
        process.exit(1);

    });
