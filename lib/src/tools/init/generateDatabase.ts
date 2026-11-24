// deps

    // natives
    import { URL } from "node:url";

    // externals
    import { isFile } from "node-pluginsmanager-plugin";
    import { Sequelize } from "sequelize";

    // locals
    import sqliteDialect from "./sqliteDialect";
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

    // Sequelize parses sqlite:C:\... with url.parse(), treating "C:" as host "c".
    // Always pass Windows (and any) file paths via options.storage instead of a URI.
    function _getSqliteStorage (databaseUri: string): string {

        let storage: string = databaseUri.replace(/^sqlite:/i, "");

        if (storage.startsWith("//")) {
            storage = storage.slice(2);
        }

        // sqlite:///C:/path → /C:/path
        if (/^\/[A-Za-z]:[\\/]/.test(storage)) {
            storage = storage.slice(1);
        }

        return storage;

    }

    function _getSequelizeSqliteOptions (storage: string): Options {

        return {
            "dialect": "sqlite",
            "storage": storage,
            "logging": false, // SQL echo would recurse once Winston writes to this database
            "dialectModule": sqliteDialect
        };

    }

    function _getSequelizeUriOptions (databaseUri: string): Promise<Options> {

        const dialect: string = _getUriDialect(databaseUri);

        if ("sqlite" !== dialect && "postgres" !== dialect && "postgresql" !== dialect) {
            throw new Error("Unsupported database dialect \"" + dialect + "\". Use postgres://, postgresql://, or sqlite://.");
        }

        if ("sqlite" === dialect) {
            return Promise.resolve(_getSequelizeSqliteOptions(_getSqliteStorage(databaseUri)));
        }

        // literal specifier: loaded only for postgres, still embedded by bun build
        return import("pg").then((pg): Options => {

            return {
                "logging": false, // SQL echo would recurse once Winston writes to this database
                "dialectModule": pg
            };

        });

    }

    function _createSequelize (databaseUri: string): Promise<Sequelize> {

        return _getSequelizeUriOptions(databaseUri).then((options: Options): Sequelize => {

            if ("sqlite" === options.dialect) {
                return new Sequelize(options);
            }

            return new Sequelize(databaseUri, options);

        });

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
            return _createSequelize(databaseUri).then((sequelize: Sequelize): Promise<void> => {
                return _initDatabase(container, sequelize);
            });
        }

    }

    // default: local SQLite file in data-directory
    const databaseFile: string = container.get<string>("database-file");

    return isFile(databaseFile).then((exists: boolean): Promise<void> => {

        if (!exists) {
            container.get<iLogger>("log").info("Database not detected, create one at " + databaseFile);
        }

        return _initDatabase(container, new Sequelize(_getSequelizeSqliteOptions(databaseFile)));

    });

}
