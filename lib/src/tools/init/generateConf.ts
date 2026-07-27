/*
    eslint-disable n/no-process-env
*/

// deps

    // natives
    import { join } from "node:path";
    import { randomBytes } from "node:crypto";
    import { readFile, writeFile } from "node:fs/promises";

    // externals
    import ConfManager from "node-confmanager";
    import { isFile } from "node-pluginsmanager-plugin";

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
            .document("port", "The application's port")
            .skeleton("debug", "boolean")
            .document("debug", "The application's debug mode")
            .skeleton("auth-access-token", "string")
            .document("auth-access-token", "The application's access token")
            .skeleton("auth-refresh-token", "string")
            .document("auth-refresh-token", "The application's refresh token");

    const envFile: string = join(container.get<string>("data-directory"), ".env");

    // generate server key
    return Promise.resolve().then(async (): Promise<void> => {

        // if server key file is already set, return
        if (await isFile(envFile)) {
            return Promise.resolve();
        }

        // if server key file does not exist, create it

        const accessToken: string = randomBytes(64).toString("hex");
        const refreshToken: string = randomBytes(64).toString("hex");

        return writeFile(envFile, ""
            + "AUTH-ACCESS-TOKEN=" + accessToken
            + "\n"
            + "AUTH-REFRESH-TOKEN=" + refreshToken,
        "utf-8");

    // load conf
    }).then((): Promise<void> => {

        return confManager.load({
            "loadConsole": true,
            "loadEnv": true,
            "loadEnvFile": join(container.get<string>("data-directory"), ".env")
        });

    // default values
     }).then(async (): Promise<void> => {

        if (!confManager.has("port")) {
            confManager.set("port", 8000);
        }

        if (!confManager.has("debug")) {
            confManager.set("debug", true);
        }

        if (!confManager.get<boolean>("debug")) {
            process.env.NODE_ENV = "production";
        }

        if (!confManager.has("auth-access-token")) {

            const accessToken: string = randomBytes(64).toString("hex");

            await writeFile(envFile, await readFile(envFile, "utf-8") + `\nAUTH-ACCESS-TOKEN=${accessToken}`, "utf-8");
            confManager.set("auth-access-token", accessToken);

        }

        if (!confManager.has("auth-refresh-token")) {

            const refreshToken: string = randomBytes(64).toString("hex");

            await writeFile(envFile, await readFile(envFile, "utf-8") + `\nAUTH-REFRESH-TOKEN=${refreshToken}`, "utf-8");
            confManager.set("auth-refresh-token", refreshToken);

        }

    });

}
