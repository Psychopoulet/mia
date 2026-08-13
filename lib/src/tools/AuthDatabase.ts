// deps

    // externals
    import SQLite3 from "better-sqlite3";
    import bcrypt from "bcrypt";

// types & interfaces

    // externals
    import type { Database } from "better-sqlite3";

    // locals

    export interface AuthUser {
        "id": number;
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

            const user: Record<string, unknown> | undefined = this._database.prepare(`
                SELECT users.name, users.password, tokens.token
                FROM tokens
                INNER JOIN users ON users.id = tokens.idUser
                WHERE tokens.token = ?
            `).get(token) as Record<string, unknown> | undefined;

            if (!user) {
                return resolve(user);
            }

            user.isAdmin = 1 === user.isAdmin;

            return resolve(user as unknown as FullAuth);

        });

    }

    public getUserByNameAndPassword (name: string, password: string): Promise<AuthUser | undefined> {

        return new Promise((resolve:(result: Record<string, unknown> | undefined) => void): void => {

            resolve(this._database.prepare(`
                SELECT users.id, users.name, users.password, users.isAdmin, users.createdAt
                FROM users
                WHERE users.name = ?
            `).get(name) as Record<string, unknown> | undefined);

        }).then((user: Record<string, unknown> | undefined): Promise<AuthUser | undefined> => {

            if (!user) {
                return Promise.resolve(user);
            }

            return bcrypt.compare(password, user.password as string).then((isValid: boolean): AuthUser | undefined => {

                return isValid
                    ? {
                        ...user,
                        "isAdmin": 1 === user.isAdmin
                    } as unknown as AuthUser
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

    public addToken (idUser: number, token: string, fingerprint: string): Promise<void> {

        return new Promise((resolve:() => void): void => {

            this._database
                .prepare("INSERT INTO tokens (idUser, token, fingerprint) VALUES (?, ?, ?)")
                .run(idUser, token, fingerprint);

            resolve();

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
