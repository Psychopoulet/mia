// deps

    // natives
    import { nextTick } from "node:process";

    // externals
    import { Database as BunDatabase } from "bun:sqlite"; // runtime builtin, not an npm dependency

// types & interfaces

    // externals
    import type { SQLQueryBindings } from "bun:sqlite"; // runtime builtin, not an npm dependency

    // locals

    type SqliteCallback = (this: Statement, error: Error | null, rows?: unknown) => void;

// consts

    // same bit flags as node-sqlite3, which Sequelize ORs together
    const OPEN_READONLY: number = 1;
    const OPEN_READWRITE: number = 2;
    const OPEN_CREATE: number = 4;

// private

    function _hasOpenFlag (mode: number, flag: number): boolean {

        return 1 === Math.floor(mode / flag) % 2;

    }

    class Statement {

        public lastID: number;

        public changes: number;

        public constructor (lastID: number, changes: number) {

            this.lastID = lastID;
            this.changes = changes;

        }

    }

    class SqliteDatabase {

        public filename: string;

        readonly #database: BunDatabase | null;

        public constructor (filename: string, mode: number, callback?: (error: Error | null) => void) {

            this.filename = filename;
            this.#database = null;

            try {

                const readonly: boolean = _hasOpenFlag(mode, OPEN_READONLY) && !_hasOpenFlag(mode, OPEN_READWRITE);

                this.#database = new BunDatabase(filename, {
                    "readonly": readonly,
                    "create": _hasOpenFlag(mode, OPEN_CREATE)
                });

            }
            catch (error) {

                if (!callback) {
                    throw error;
                }

                nextTick((): void => {
                    callback(error as Error);
                });

                return;

            }

            // Sequelize assigns the instance before reading it from the open callback
            if (callback) {
                nextTick((): void => {
                    callback(null);
                });
            }

        }

        public run (sql: string, params?: unknown, callback?: SqliteCallback): void {

            this.#execute("run", sql, params, callback);

        }

        public get (sql: string, params?: unknown, callback?: SqliteCallback): void {

            this.#execute("get", sql, params, callback);

        }

        public all (sql: string, params?: unknown, callback?: SqliteCallback): void {

            this.#execute("all", sql, params, callback);

        }

        public exec (sql: string, callback?: SqliteCallback): void {

            try {

                this.#open().exec(sql);

                if (callback) {
                    return callback.call(new Statement(0, 0), null);
                }

            }
            catch (error) {

                if (!callback) {
                    throw error;
                }

                return callback.call(new Statement(0, 0), error as Error);

            }

            return undefined;

        }

        public serialize (callback: () => void): void {

            callback();

        }

        public close (callback?: (error: Error | null) => void): void {

            try {

                this.#open().close();

                if (callback) {
                    return callback(null);
                }

            }
            catch (error) {

                if (!callback) {
                    throw error;
                }

                return callback(error as Error);

            }

            return undefined;

        }

        #execute (method: "all" | "get" | "run", sql: string, params?: unknown, callback?: SqliteCallback): void {

            const parsed: { "params": unknown; "callback"?: SqliteCallback } = _splitCallback(params, callback);

            try {

                const result: unknown = _invoke(this.#open().query(sql), method, parsed.params);
                const statement: Statement = _statement(method, result);

                if (parsed.callback) {
                    return parsed.callback.call(statement, null, "run" === method ? null : result);
                }

            }
            catch (error) {

                if (!parsed.callback) {
                    throw error;
                }

                return parsed.callback.call(new Statement(0, 0), error as Error);

            }

            return undefined;

        }

        #open (): BunDatabase {

            if (!this.#database) {
                throw new Error("SQLite database is not open");
            }

            return this.#database;

        }

    }

    function _splitCallback (params?: unknown, callback?: SqliteCallback): { "params": unknown; "callback"?: SqliteCallback } {

        if ("function" === typeof params) {
            return {
                "params": [],
                "callback": params as SqliteCallback
            };
        }

        return {
            "params": "undefined" === typeof params ? [] : params,
            "callback": callback
        };

    }

    function _isRecord (value: unknown): value is Record<string, unknown> {

        return "object" === typeof value && null !== value && !Array.isArray(value);

    }

    function _invoke (statement: ReturnType<BunDatabase["query"]>, method: "all" | "get" | "run", params: unknown): unknown {

        if (Array.isArray(params)) {
            const values: SQLQueryBindings[] = [];

            params.forEach((value: unknown): void => {
                values.push(value as SQLQueryBindings);
            });

            return statement[method](...values);
        }

        if (_isRecord(params)) {
            return statement[method](params as SQLQueryBindings);
        }

        return statement[method]();

    }

    function _statement (method: "all" | "get" | "run", result: unknown): Statement {

        if ("run" !== method || !_isRecord(result)) {
            return new Statement(0, 0);
        }

        const meta: { "changes": number; "lastInsertRowid": number | bigint } = result as { "changes": number; "lastInsertRowid": number | bigint };

        return new Statement(Number(meta.lastInsertRowid), meta.changes);

    }

// module

export default {
    "Database": SqliteDatabase,
    "OPEN_READONLY": OPEN_READONLY,
    "OPEN_READWRITE": OPEN_READWRITE,
    "OPEN_CREATE": OPEN_CREATE
};
