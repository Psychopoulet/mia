// deps

    // externals
    import SQLite3 from "better-sqlite3";

    // locals
    import authCryptPassword from "./authCryptPassword";

// types & interfaces

    // externals
    import type { Database } from "better-sqlite3";

    // locals

    export interface AuthUser {
        "id": number;
        "name": string;
        "password": string;
    }

    export interface AuthToken {
        "token": string;
    }

    export interface FullAuth {
        "name": string;
        "password": string;
        "token": string;
    }

// module

export default class AuthDatabase {

    private readonly _database: Database;

    public constructor (filename: string) {

        this._database = new SQLite3(filename);
        this._database.pragma("foreign_keys = ON");

    }

    public init (): Promise<void> {

        return new Promise((resolve): void => {

            this._database.exec(`

                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                );

                CREATE TABLE tokens (
                    id_user INTEGER NOT NULL,
                    token TEXT NOT NULL UNIQUE,
                    FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE INDEX idx_tokens_id_user ON tokens(id_user);

            `);

            this._database
                .prepare("INSERT INTO users (name, password) VALUES (?, ?);")
                .run("admin", authCryptPassword("admin"));

            resolve();

        });

    }

    public close (): void {
        this._database.close();
    }

    public getUserByToken (token: string): Promise<FullAuth | undefined> {

        return new Promise((resolve:(result: FullAuth | undefined) => void): void => {

            resolve(this._database.prepare(`
                SELECT users.name, users.password, tokens.token
                FROM tokens
                INNER JOIN users ON users.id = tokens.id_user
                WHERE tokens.token = ?
            `).get(token) as FullAuth | undefined);

        });

    }

    public getUserByNameAndPassword (name: string, password: string): Promise<AuthUser | undefined> {

        return new Promise((resolve:(result: AuthUser | undefined) => void): void => {

            resolve(this._database.prepare(`
                SELECT users.id, users.name, users.password
                FROM users
                WHERE users.name = ? AND users.password = ?
            `).get(name, authCryptPassword(password)) as AuthUser | undefined);

        });

    }

    public addToken (idUser: number, token: string): Promise<void> {

        return new Promise((resolve:() => void): void => {

            this._database
                .prepare("INSERT INTO tokens (id_user, token) VALUES (?, ?)")
                .run(idUser, token);

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
