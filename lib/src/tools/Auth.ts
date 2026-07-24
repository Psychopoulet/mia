// deps

    // natives
    import { createHash } from "node:crypto";

    // externals
    import SQLite3 from "better-sqlite3";

// types & interfaces

    // externals
    import type { Database } from "better-sqlite3";

    // locals

    export interface AuthUser {
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

export default class Auth {

    private readonly _database: Database;

    public constructor (filename: string) {
        this._database = new SQLite3(filename);
    }

    public init (): Promise<void> {

        return new Promise((resolve): void => {

            this._database.exec(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    password TEXT NOT NULL
                );

                CREATE TABLE tokens (
                    id_user INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    FOREIGN KEY (id_user) REFERENCES users(id)
                );

                INSERT INTO users (name, password) VALUES ('admin', 'admin');
            `);

            resolve();

        });

    }

    public comparePassword (password: string, storedCryptedPassword: string): boolean {
        return createHash("sha256").update(password).digest("hex") === storedCryptedPassword;
    }

    public close (): void {
        this._database.close();
    }

    public getUserByToken (token: string): Promise<FullAuth | undefined> {

        return new Promise((resolve): void => {

            resolve(this._database.prepare(`
                SELECT u.name, u.password, t.token
                FROM tokens t
                INNER JOIN users u ON u.id = t.id_user
                WHERE t.token = ?
            `).get(token) as FullAuth | undefined);

        });

    }

    /*
    public addUser(name: string, password: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._database.exec(`
                INSERT INTO users (name, password) VALUES (?, ?);
            `);
            resolve();
        });
    }

    public getUser(name: string): Promise<AuthUser | undefined> {
        return new Promise((resolve, reject) => {
            this._database.get(`
                SELECT * FROM users WHERE name = ?;
            `);
            resolve(result);
        });
    }

    public getToken(token: string): Promise<AuthToken | undefined> {
        return new Promise((resolve, reject) => {
            this._database.get(`
                SELECT * FROM tokens WHERE token = ?;
            `);
            resolve(result);
        });
    }

    public addToken(id_user: number, token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._database.exec(`
                INSERT INTO tokens (id_user, token) VALUES (?, ?);
            `);
            resolve();
        });
    }

    public removeToken(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._database.exec(`
                DELETE FROM tokens WHERE token = ?;
            `);
            resolve();
        });
    }

    public getUser(name: string): Promise<AuthUser | undefined> {
        return new Promise((resolve, reject) => {
            this._database.get(`
                SELECT * FROM users WHERE name = ?;
            `);
            resolve(result);
        });
    }
    */

}
