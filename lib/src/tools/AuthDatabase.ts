// deps

    // externals
    import SQLite3 from "better-sqlite3";
    import bcrypt from "bcrypt";

// types & interfaces

    // externals
    import type { Database } from "better-sqlite3";

    // locals

    interface AuthUserSQL {
        "id": number;
        "name": string;
        "password": string;
        "isAdmin": 1 | 0;
        "createdAt": Date;
    }

    interface AuthUserTokenSQL extends AuthUserSQL {
        "idUser": number;
        "token": string;
        "fingerprint": string;
    }

    export interface AuthUser {
        "name": string;
        "password": string;
        "isAdmin": boolean;
        "createdAt": Date;
    }

    export interface AuthToken {
        "token": string;
        "fingerprint": string;
        "createdAt": Date;
    }

    export interface FullAuth {
        "name": string;
        "password": string;
        "isAdmin": boolean;
        "token": string;
    }

// consts

    const BCRYPT_ROUNDS: number = 10;

// module

export default class AuthDatabase {

    private readonly _database: Database;

    public constructor (filename: string) {

        this._database = new SQLite3(filename);
        this._database.pragma("foreign_keys = ON");

    }

    public init (): Promise<void> {

        return new Promise((resolve:(result?: unknown) => void): void => {

            this._database.exec(`

                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    password TEXT NOT NULL,
                    isAdmin INTEGER NOT NULL CHECK(isAdmin IN (0,1)) DEFAULT 0,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE UNIQUE INDEX idx_users_name ON users(name);

                CREATE TABLE tokens (
                    idUser INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    fingerprint TEXT NOT NULL,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (idUser) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE UNIQUE INDEX idx_tokens_token ON tokens(token);
                CREATE INDEX idx_tokens_idUser ON tokens(idUser);

            `);

            resolve();

        }).then(() => {
            return this.addUser("admin", "admin", true);
        });

    }

    public close (): void {
        this._database.close();
    }

    private _getUserIdByName (name: string): Promise<number | undefined> {

        return new Promise((resolve:(result: number | undefined) => void): void => {

            const data: Record<string, number> | undefined = this._database.prepare("SELECT id FROM users WHERE name = ?").get(name) as Record<string, number> | undefined;

            if (!data) {
                return resolve(data);
            }

            return resolve(data.id);

        });

    }

    public addUser (name: string, password: string, isAdmin: boolean = false): Promise<void> {

        const createdAt = new Date();

        return bcrypt.hash(password, BCRYPT_ROUNDS).then((hash: string): void => {

            this._database
                .prepare("INSERT INTO users (name, password, isAdmin, createdAt) VALUES (?, ?, ?, ?);")
                .run(name, hash, isAdmin ? 1 : 0, createdAt.toISOString());

        });

    }

    public editUserPassword (name: string, password: string): Promise<void> {

        return bcrypt.hash(password, BCRYPT_ROUNDS).then((hash: string): void => {

            this._database
                .prepare("UPDATE users SET password = ? WHERE name = ?;")
                .run(name, hash);

        });

    }

    public editUserIsAdmin (name: string, isAdmin: boolean): Promise<void> {

        return new Promise((resolve:() => void): void => {

            this._database
                .prepare("UPDATE users SET isAdmin = ? WHERE name = ?;")
                .run(isAdmin ? 1 : 0, name);

            resolve();

        });

    }

    public getUserByToken (token: string): Promise<FullAuth | undefined> {

        return new Promise((resolve:(result: FullAuth | undefined) => void): void => {

            const user: AuthUserTokenSQL | undefined = this._database.prepare(`
                SELECT
                    users.name, users.password, users.isAdmin,
                    tokens.token
                FROM tokens
                INNER JOIN users ON users.id = tokens.idUser
                WHERE tokens.token = ?
            `).get(token) as AuthUserTokenSQL | undefined;

            if (!user) {
                return resolve(user);
            }

            return resolve({
                "name": user.name,
                "password": user.password,
                "isAdmin": 1 === user.isAdmin,
                "token": user.token
            });

        });

    }

    public getUserByNameAndPassword (name: string, password: string): Promise<AuthUser | undefined> {

        return new Promise((resolve:(result: AuthUserSQL | undefined) => void): void => {

            resolve(this._database.prepare(`
                SELECT users.id, users.name, users.password, users.isAdmin, users.createdAt
                FROM users
                WHERE users.name = ?
            `).get(name) as AuthUserSQL | undefined);

        }).then((user: AuthUserSQL | undefined): Promise<AuthUser | undefined> => {

            if (!user) {
                return Promise.resolve(user);
            }

            return bcrypt.compare(password, user.password).then((isValid: boolean): AuthUser | undefined => {

                return isValid
                    ? {
                        "name": user.name,
                        "password": user.password,
                        "createdAt": user.createdAt,
                        "isAdmin": 1 === user.isAdmin
                    }
                    : undefined;

            });

        });

    }

    public getTokensByUserName (name: string): Promise<AuthToken[]> {

        return new Promise((resolve:(result: AuthToken[]) => void): void => {

            resolve(this._database.prepare(`
                SELECT tokens.token, tokens.fingerprint, tokens.createdAt
                FROM tokens
                INNER JOIN users ON users.id = tokens.idUser
                WHERE users.name = ?
            `).all(name) as AuthToken[]);

        });

    }

    public addToken (name: string, token: string, fingerprint: string): Promise<void> {

        return this._getUserIdByName(name).then((idUser: number | undefined): Promise<void> => {

            if ("undefined" === typeof idUser) {
                return Promise.reject(new Error("User not found"));
            }

            return new Promise((resolve:() => void): void => {

                this._database
                    .prepare("INSERT INTO tokens (idUser, token, fingerprint) VALUES (?, ?, ?)")
                    .run(idUser, token, fingerprint);

                resolve();

            });

        });

    }

    public removeToken (token: string): Promise<void> {

        return new Promise((resolve:() => void): void => {

            this._database
                .prepare("DELETE FROM tokens WHERE token = ?")
                .run(token);

            resolve();

        });

    }

}
