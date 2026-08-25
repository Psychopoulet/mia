// deps

    // locals
    import AuthDatabase from "../AuthDatabase";
    import User from "../models/User";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

// module

export default function generateAuthDatabase (container: ContainerPattern): Promise<void> {

    const database: AuthDatabase = new AuthDatabase();
    container.set("auth-db", database);

    return User.count().then((count: number): Promise<void> => {

        if (0 !== count) {
            return Promise.resolve();
        }

        return database.addUser("admin", "admin", true);

    });

}
