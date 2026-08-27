// deps

    // natives
    import { URL } from "node:url";

    // externals
    import { isFile } from "node-pluginsmanager-plugin";
    import { Sequelize, type Options } from "sequelize";
    import sqlite3 from "sqlite3";
    import User, { registerUser } from "../models/User";
    import { registerLog } from "../models/Log";
    import { registerToken } from "../models/Token";
    import authDatabase from "../AuthDatabase";

// types & interfaces

    // externals
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { iLogger } from "./generateLogger";

// private

    function _getUriDialect (databaseUri: string): string {

        return new URL(databaseUri).protocol.replace(/:$/, "");

    }

    function _getSequelizeUriOptions (databaseUri: string): Options {

        const options: Options = {
            "logging": false // SQL echo would recurse once Winston writes to this database
        };

        // dialectModule is dialect-specific; never force sqlite3 on a postgres/mysql/mongodb URI
        if ("sqlite" === _getUriDialect(databaseUri)) {
            options.dialectModule = sqlite3;
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

            }).then((): void => {

                container.set("auth-db", authDatabase);

            });

        });

    }

// module

export default function generateDatabase (container: ContainerPattern): Promise<void> {

    const conf: ConfManager = container.get<ConfManager>("conf");

    // explicit URI: reject on connection failure, never fall back to SQLite
    if (conf.has("database-uri")) {

        const databaseUri: string = conf.get<string>("database-uri");

        return _initDatabase(container, new Sequelize(databaseUri, _getSequelizeUriOptions(databaseUri)));

    }

    // default: local SQLite file in data-directory
    const databaseFile: string = container.get<string>("database-file");

    return isFile(databaseFile).then((exists: boolean): Promise<void> => {

        if (!exists) {
            container.get<iLogger>("log").info("Database not detected, create one at " + databaseFile);
        }

        return _initDatabase(container, new Sequelize({
            "dialect": "sqlite",
            "storage": databaseFile,
            "dialectModule": sqlite3,
            "logging": false
        }));

    });

}
