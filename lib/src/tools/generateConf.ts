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

    // locals
    import type { iLogger } from "./generateLogger";

// module

export default function generateConf (container: ContainerPattern): Promise<void> {

    const confFile: string = join(container.get("data-directory") as string, "conf.json");

    const confManager: ConfManager = new ConfManager(confFile);

        container
            .set("conf", confManager)
            .document("conf", "The application's configuration (instance of 'node-confmanager' package)");

        confManager.skeleton("port", "integer");
        confManager.skeleton("debug", "boolean");

    return confManager.fileExists().then((exists: boolean): Promise<void> => {

        if (!exists) {

            (container.get("log") as iLogger).warning("Conf file not detected, create one at " + confFile);

            confManager.set("port", 8000);
            confManager.set("debug", true);

            return confManager.save();

        }
        else {
            return confManager.load();
        }

    }).then((): void => {

        if (!(confManager.get("debug") as boolean)) {
            process.env.NODE_ENV = "production";
        }

    });

}
