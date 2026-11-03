// deps

    // natives
    import { stat, mkdir } from "node:fs";

// types & interfaces

    // natives
    import type { Stats } from "node:fs";

    // externals
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { iLogger } from "./generateLogger";

// module

function _ensureDirectory (label: "data" | "logs", container: ContainerPattern): Promise<void> {

    const directory: string = container.get<string>(label + "-directory");

    return new Promise((resolve: (result: boolean) => void): void => {

        return stat(directory, (err: Error | null, stats: Stats): void => {
            return Boolean(err) || !stats.isDirectory() ? resolve(false) : resolve(true);
        });

    }).then((result: boolean): Promise<void> => {

        return new Promise((resolve: () => void, reject: (err: Error) => void): void => {

            if (result) {
                return resolve();
            }

            container.get<iLogger>("log").warning("'" + label + "' directory not detected, create one at " + directory);

            return mkdir(directory, {
                "recursive": true
            }, (err: NodeJS.ErrnoException | null): void => {
                return err ? reject(err) : resolve();
            });

        });

    });

}

export default function ensureAppDirectories (container: ContainerPattern): Promise<void> {

    return _ensureDirectory("data", container).then((): Promise<void> => {

        return _ensureDirectory("logs", container);

    });

}
