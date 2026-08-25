// deps

    // natives
    import { readFile } from "node:fs";
    import { homedir } from "node:os";
    import { join } from "node:path";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

    // locals
    interface iPackageData {
        "name": string;
        "version": string;
        "description": string;
    }

// module

export default function registerAppData (container: ContainerPattern): Promise<void> {

    return new Promise((resolve: (content: iPackageData) => void, reject: (err: Error) => void): void => {

        const packageFile: string = join(__dirname, "..", "..", "..", "..", "package.json");

        return readFile(packageFile, "utf-8", (err: Error | null, content: string): void => {
            return err ? reject(err) : resolve(JSON.parse(content) as iPackageData);
        });

    }).then((packageData: iPackageData): void => {

        // app
        container
            .skeleton("app", "object")
            .document("app", "Application's data (extracted from package.json)")

                .skeleton("app.name", "string")
                .set("app.name", packageData.name)
                .document("app.name", "Application's name")

                .skeleton("app.version", "string")
                .set("app.version", packageData.version)
                .document("app.version", "Application's version")

                .skeleton("app.description", "string")
                .set("app.description", packageData.description)
                .document("app.description", "Application's description");

        // directories
        container
            .skeleton("data-directory", "string")
            .set("data-directory", join(homedir(), container.get<string>("app.name"), "data"))
            .document("data-directory", "Where the application's data are registered")

            .skeleton("plugins-data-directory", "string")
            .set("plugins-data-directory", join(homedir(), container.get<string>("app.name"), "data", "plugins"))
            .document("plugins-data-directory", "Where the application's plugins data are registered")

            .skeleton("plugins-directory", "string")
            .set("plugins-directory", join(homedir(), container.get<string>("app.name"), "plugins"))
            .document("plugins-directory", "Where the application's plugins are stored and executed");

        // logs
        container
            .skeleton("logs-file", "string")
            .set("logs-file", join(container.get<string>("data-directory"), "logs.txt"))
            .document("logs-file", "The application's file where the logs are registered");

        // database
        container
            .skeleton("database-file", "string")
            .set("database-file", join(container.get<string>("data-directory"), "mia-database.db"))
            .document("database-file", "The application's file where the local SQLite database is registered")

            .document("database", "The application's database (Sequelize for SQLite, MongoDatabase for MongoDB)")

            .document("auth-db", "The application's authentication facade (instance of AuthDatabase)");

        // server socket
        container
            .document("server-socket", "The application's server websocket");

    });

}
