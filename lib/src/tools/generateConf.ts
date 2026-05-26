/*
    eslint-disable n/no-process-env
*/

// deps

    // externals
    import ConfManager from "node-confmanager";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

// module

export default function generateConf (container: ContainerPattern): Promise<void> {

    const confManager: ConfManager = new ConfManager();

        container
            .set("conf", confManager)
            .document("conf", "The application's configuration (instance of 'node-confmanager' package)");

        confManager
            .skeleton("port", "integer")
            .skeleton("debug", "boolean");

     return confManager.load({
        "loadConsole": true,
        "loadEnv": true
     }).then((): void => {

        // default values

        if (!confManager.has("port")) {
            confManager.set("port", 8000);
        }

        if (!confManager.has("debug")) {
            confManager.set("debug", true);
        }

        if (!confManager.get<boolean>("debug")) {
            process.env.NODE_ENV = "production";
        }

    });

}
