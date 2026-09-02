/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
// - @typescript-eslint/no-require-imports is disabled because we need to import dynamically the SQL module (depends of the database dialect)
// - @typescript-eslint/no-var-requires is disabled for the same reason

// deps

    // natives
    import { URL } from "node:url";

    // externals
    import { isFile } from "node-pluginsmanager-plugin";
    import { Sequelize } from "sequelize";
    import User, { registerUser } from "../models/User";
    import { registerLog } from "../models/Log";
    import { registerToken } from "../models/Token";

// types & interfaces

    // externals
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";
    import type { Options } from "sequelize";

    // locals
    import type { iLogger } from "./generateLogger";

// private

    function _getUriDialect (databaseUri: string): string {

        return new URL(databaseUri).protocol.replace(/:$/, "");

    }

    function _getSequelizeUriOptions (databaseUri: string): Options {

        const dialect: string = _getUriDialect(databaseUri);

        if ("sqlite" !== dialect && "postgres" !== dialect && "postgresql" !== dialect) {
            throw new Error("Unsupported database dialect \"" + dialect + "\". Use postgres://, postgresql://, or sqlite://.");
        }

        const options: Options = {
            "logging": false // SQL echo would recurse once Winston writes to this database
        };

        // dialectModule is dialect-specific; never force sqlite3 on a postgres URI
        if ("sqlite" === dialect) {
            const sqlite3 = require("sqlite3") as object;
            options.dialectModule = sqlite3;
        }
        else {
            const pg = require("pg") as object;
            options.dialectModule = pg;
        }

        return options;

    }

    function _initDatabase (container: ContainerPattern, sequelize: Sequelize): Promise<void> {

        // models must be registered before sync(), otherwise no table is created
        registerLog(sequelize);
        registerUser(sequelize);
        registerToken(sequelize); // after User: FK + associations

        return sequelize.authenticate().then((): Promise<Sequelize> => {

            // create missing tables only (no alter / force)
            return sequelize.sync();

        }).then((): Promise<void> => {

            container.set("database", sequelize);

            return User.count().then((count: number): Promise<void> => {

                if (0 !== count) {
                    return Promise.resolve();
                }

                return User.create({
                    "name": "admin",
                    "password": "admin",
                    "isAdmin": true
                }).then((): void => {

                    return undefined;

                });

            });

        });

    }

// module

export default function generateDatabase (container: ContainerPattern): Promise<void> {

    const conf: ConfManager = container.get<ConfManager>("conf");

    // explicit URI: reject on connection failure, never fall back to SQLite
    if (conf.has("database-uri")) {

        const databaseUri: string = conf.get<string>("database-uri").trim();

        if ("" !== databaseUri) {
            return _initDatabase(container, new Sequelize(databaseUri, _getSequelizeUriOptions(databaseUri)));
        }

    }

    // default: local SQLite file in data-directory
    const databaseFile: string = container.get<string>("database-file");

    return isFile(databaseFile).then((exists: boolean): Promise<void> => {

        if (!exists) {
            container.get<iLogger>("log").info("Database not detected, create one at " + databaseFile);
        }

        const databaseUri: string = "sqlite:" + databaseFile;

        return _initDatabase(container, new Sequelize(databaseUri, _getSequelizeUriOptions(databaseUri)));

    });

}
