// deps

    // natives
    import { nextTick } from "node:process";

    // externals
    import SQLite3, { type Database as BetterSqlite3Database, type RunResult } from "better-sqlite3";

// types & interfaces

    type SqliteErrorCallback = (err: Error | null) => void;

    interface Statement {
        "lastID": number;
        "changes": number;
    }

    type SqliteQueryCallback = (this: Statement, err: Error | null, results?: unknown) => void;

    type BindParams = unknown[] | Record<string, unknown>;

    interface NormalizedQueryArgs {
        "params": BindParams;
        "callback"?: SqliteQueryCallback;
    }

    interface ExecutedQuery {
        "statement": Statement;
        "results": unknown[];
    }

// consts

    // sqlite3 open flags expected by Sequelize's SQLite dialect
    const OPEN_READONLY: number = 1;
    const OPEN_READWRITE: number = 2;
    const OPEN_CREATE: number = 4;

// module

function hasOpenFlag (flags: number, flag: number): boolean {

    // sqlite3 modes are bit flags (OPEN_READONLY=1, OPEN_READWRITE=2, OPEN_CREATE=4)
    return 0 !== Math.floor(flags / flag) % 2;

}

function createStatement (lastID: number, changes: number): Statement {

    const statement: Statement = {
        "lastID": lastID,
        "changes": changes
    };

    // sequelize checks metaData.constructor.name === "Statement" after bulk INSERT
    Object.defineProperty(statement, "constructor", {
        "value": {
            "name": "Statement"
        }
    });

    return statement;

}

function normalizeQueryArgs (
    paramsOrCallback?: BindParams | SqliteQueryCallback,
    callback?: SqliteQueryCallback
): NormalizedQueryArgs {

    if ("function" === typeof paramsOrCallback) {

        return {
            "params": [],
            "callback": paramsOrCallback
        };

    }

    return {
        "params": paramsOrCallback ?? [],
        "callback": callback
    };

}

function toBetterSqliteParams (params: BindParams): unknown[] | Record<string, unknown> {

    if (Array.isArray(params)) {
        return params;
    }

    const named: Record<string, unknown> = {};

    for (const key of Object.keys(params)) {

        // sqlite3 keeps "$1"; better-sqlite3 wants the name without the prefix
        const name: string = /^[:@$]/u.test(key) ? key.slice(1) : key;
        named[name] = params[key];

    }

    return named;

}

function applyBind<T> (method: (...bound: unknown[]) => T, params: BindParams): T {

    const bound = toBetterSqliteParams(params);

    if (Array.isArray(bound)) {
        return method(...bound);
    }

    if (0 === Object.keys(bound).length) {
        return method();
    }

    return method(bound);

}

function notifyError (callback: SqliteErrorCallback | undefined, err: Error): void {

    if (!callback) {
        throw err;
    }

    nextTick((): void => {
        callback(err);
    });

}

function finishQuery (
    callback: SqliteQueryCallback | undefined,
    payload: { "err": Error | null; "statement": Statement; "results"?: unknown }
): void {

    if (!callback) {

        if (payload.err) {
            throw payload.err;
        }

        return;

    }

    nextTick((): void => {
        callback.call(payload.statement, payload.err, payload.results);
    });

}

function executeSql (db: BetterSqlite3Database, sql: string, params: BindParams): ExecutedQuery {

    const stmt = db.prepare(sql);

    // sqlite3's all() accepts DDL; better-sqlite3's all() throws if the statement returns no rows
    if (stmt.reader) {

        return {
            "statement": createStatement(0, 0),
            "results": applyBind(stmt.all.bind(stmt), params)
        };

    }

    const info: RunResult = applyBind(stmt.run.bind(stmt), params);

    return {
        "statement": createStatement(Number(info.lastInsertRowid), info.changes),
        "results": []
    };

}

function openBetterSqlite (filename: string, flags: number): BetterSqlite3Database {

    return new SQLite3(filename, {
        "readonly": hasOpenFlag(flags, OPEN_READONLY),
        "fileMustExist": !hasOpenFlag(flags, OPEN_CREATE)
    });

}

// Sequelize 6 SQLite dialect is built for the sqlite3 package (async, Database property).
// better-sqlite3 is the constructor itself and is synchronous; this class bridges the two.
class Database {

    public filename: string;
    public uuid?: string;

    private readonly _db: BetterSqlite3Database | null;

    public constructor (filename: string, mode?: number | SqliteErrorCallback, callback?: SqliteErrorCallback) {

        this.filename = filename;

        const flags: number = "number" === typeof mode ? mode : OPEN_READWRITE + OPEN_CREATE;
        const done: SqliteErrorCallback | undefined = "function" === typeof mode ? mode : callback;

        try {

            this._db = openBetterSqlite(filename, flags);

            if (done) {
                nextTick((): void => {
                    done(null);
                });
            }

        }
        catch (err) {

            this._db = null;
            notifyError(done, err as Error);

        }

    }

    // sqlite3 queues statements; better-sqlite3 is already serial
    public serialize (fn: () => void): this {

        fn();

        return this;

    }

    public run (sql: string, paramsOrCallback?: BindParams | SqliteQueryCallback, callback?: SqliteQueryCallback): this {
        return this._query(sql, normalizeQueryArgs(paramsOrCallback, callback));
    }

    public all (sql: string, paramsOrCallback?: BindParams | SqliteQueryCallback, callback?: SqliteQueryCallback): this {
        return this._query(sql, normalizeQueryArgs(paramsOrCallback, callback));
    }

    public close (callback?: SqliteErrorCallback): void {

        try {

            if (true === this._db?.open) {
                this._db.close();
            }

            if (callback) {
                nextTick((): void => {
                    callback(null);
                });
            }

        }
        catch (err) {
            notifyError(callback, err as Error);
        }

    }

    private _query (sql: string, args: NormalizedQueryArgs): this {

        if (!this._db) {
            finishQuery(args.callback, {
                "err": new Error("SQLite database is not open"),
                "statement": createStatement(0, 0)
            });
            return this;
        }

        try {

            const executed: ExecutedQuery = executeSql(this._db, sql, args.params);

            finishQuery(args.callback, {
                "err": null,
                "statement": executed.statement,
                "results": executed.results
            });

        }
        catch (err) {
            finishQuery(args.callback, {
                "err": err as Error,
                "statement": createStatement(0, 0)
            });
        }

        return this;

    }

}

const sqlite3SequelizeAdapter = {
    "Database": Database,
    "OPEN_READONLY": OPEN_READONLY,
    "OPEN_READWRITE": OPEN_READWRITE,
    "OPEN_CREATE": OPEN_CREATE
};

export default sqlite3SequelizeAdapter;
