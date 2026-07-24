// deps

    // externals
    import { isFile } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { iLogger } from "./generateLogger";
    import Auth from "../Auth";

// module

export default function generateAuthDatabase (container: ContainerPattern): Promise<void> {

    const authFile: string = container.get<string>("auth-file");

    return isFile(authFile).then((exists: boolean): Promise<void> => {

        const database: Auth = new Auth(authFile);
        container.set("auth-db", database);

        if (exists) {
            return Promise.resolve();
        }

        container.get<iLogger>("log").info("Auth database not detected, create one at " + authFile);

        return database.init();

    });

}
