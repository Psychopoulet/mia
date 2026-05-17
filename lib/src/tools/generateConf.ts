/*
    eslint-disable n/no-process-env
*/

// deps

    // natives
    import { join } from "node:path";

    // externals
    import ConfManager from "node-confmanager";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

// module

export default function generateConf (container: ContainerPattern): Promise<void> {

    const confManager: ConfManager = new ConfManager("");

        container
            .set("conf", confManager)
            .document("conf", "The application's configuration (instance of 'node-confmanager' package)");

        confManager
            .skeleton("port", "integer")
            .skeleton("debug", "boolean");

        // default values
        confManager
            .set("port", 8000)
            .set("debug", true);

     return confManager.load({
        "loadConsole": true,
        "loadEnv": true,
        "loadEnvFile": join(container.get<string>("data-directory"), ".env")
     }).then((): void => {

        if (!confManager.get<boolean>("debug")) {
            process.env.NODE_ENV = "production";
        }

    });

}
