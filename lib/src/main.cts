/* eslint-disable n/no-process-exit */
// - n/no-process-exit is disabled because we need to exit the process manually

// deps

    // natives
    import { join } from "node:path";

    // externals
    import ContainerPattern from "node-containerpattern";

    // locals
    import registerAppData from "./tools/init/registerAppData";
    import ensureAppDirectories from "./tools/init/ensureAppDirectories";
    import generateConf from "./tools/init/generateConf";
    import generateDatabase from "./tools/init/generateDatabase";
    import generateLogger from "./tools/init/generateLogger";
    import generateAuthDatabase from "./tools/init/generateAuthDatabase";
    import checkDescriptor from "./tools/init/checkDescriptor";
    import managePlugins from "./tools/init/managePlugins";
    import generateServer from "./tools/init/generateServer";

// types & interfaces

    // externals
    import type Pluginsmanager from "node-pluginsmanager";
    import type ConfManager from "node-confmanager";
    import type { Sequelize } from "sequelize";

    // locals
    import type { iLogger } from "./tools/init/generateLogger";

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

    // check descriptor

    }).then((): Promise<void> => {

        return checkDescriptor(container);

    // ensure app directories

    }).then((): Promise<void> => {

        return ensureAppDirectories(container);

    // generate and load conf

    }).then((): Promise<void> => {

        return generateConf(container);

    // generate database

    }).then((): Promise<void> => {

        return generateDatabase(container);

    // generate advanced logger

    }).then((): void => {

        return generateLogger(container);

    // generate auth database

    }).then((): Promise<void> => {

        return generateAuthDatabase(container);

    // log basic data

    }).then((): void => {

        const log: iLogger = container.get<iLogger>("log");

        log.success(container.get<string>("app.name") + " (v" + container.get<string>("app.version") + ")");
        log.debug("env file : " + join(container.get<string>("data-directory"), ".env"));
        log.debug("logs file : " + container.get<string>("logs-file"));

        const conf: ConfManager = container.get<ConfManager>("conf");

        if (conf.has("database-uri")) {
            log.debug("database uri : " + conf.get<string>("database-uri"));
        }
        else {
            log.debug("database file : " + container.get<string>("database-file"));
        }

    // load plugins

    }).then((): Promise<void> => {

        return managePlugins(container);

    // create server

    }).then((): Promise<void> => {

        return generateServer(container);

    // catch
    }).then((): void => {

        function _handleKill (): void {

            const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");

            pluginsManager.releaseAll().then((): Promise<void> => {

                return pluginsManager.destroyAll();

            }).then((): Promise<void> => {

                if (container.has("database")) {
                    return container.get<Sequelize>("database").close();
                }

                return Promise.resolve();

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

        }

        process
            .on("SIGTERM", _handleKill)
            .on("SIGINT", _handleKill);

    // fail to run
    }).catch((err: Error): void => {

        if (container.has("log")) {

            container.get<iLogger>("log").error("Global script failed");
            container.get<iLogger>("log").error(err.message);
            container.get<iLogger>("log").debug(err.stack as string);

        }
        else {

            console.error("Global script failed");
            console.error(err);

        }

        process.exitCode = 1;
        process.exit(1);

    });
