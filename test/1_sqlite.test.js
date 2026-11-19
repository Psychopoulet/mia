// deps

    // natives
    const { mkdtemp, rm } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const { strictEqual, throws } = require("node:assert");

    // locals
    const dialect = require("../lib/src/tools/init/sqliteDialect.ts").default;

// tests

describe("sqlite dialect", () => {

    let root = "";

    beforeAll(() => {

        return mkdtemp(join(tmpdir(), "mia-sqlite-")).then((directory) => {
            root = directory;
        });

    });

    afterAll(() => {

        return root ? rm(root, {
            "force": true,
            "recursive": true
        }) : Promise.resolve();

    });

    it("should run statements and report driver errors", async () => {

        const file = join(root, "dialect.sqlite");
        const mode = dialect.OPEN_READWRITE | dialect.OPEN_CREATE;
        const database = new dialect.Database(file, mode);

        database.exec("create table item (id integer primary key, name text)");

        await new Promise((resolve, reject) => {

            database.run("insert into item (name) values (?)", [ "one" ], function onRun (err) {

                if (err) {
                    reject(err);
                    return;
                }

                strictEqual(0 < this.lastID, true);
                resolve();

            });

        });

        await new Promise((resolve, reject) => {

            database.get("select name from item where name = $name", {
                "$name": "one"
            }, (err, row) => {

                if (err) {
                    reject(err);
                    return;
                }

                strictEqual(row.name, "one");
                resolve();

            });

        });

        await new Promise((resolve, reject) => {

            database.all("select name from item", (err, rows) => {

                if (err) {
                    reject(err);
                    return;
                }

                strictEqual(rows.length, 1);
                resolve();

            });

        });

        strictEqual(database.exec("select 1"), undefined);

        await new Promise((resolve) => {

            database.exec("not sql", (err) => {
                strictEqual(err instanceof Error, true);
                resolve();
            });

        });

        throws(() => {
            database.exec("not sql");
        });

        await new Promise((resolve) => {

            database.run("not sql", (err) => {
                strictEqual(err instanceof Error, true);
                resolve();
            });

        });

        throws(() => {
            database.run("not sql");
        });

        await new Promise((resolve, reject) => {

            database.close((err) => {
                return err ? reject(err) : resolve();
            });

        });

        throws(() => {
            database.run("select 1");
        });

        await new Promise((resolve) => {

            const missing = new dialect.Database(join(root, "missing.sqlite"), dialect.OPEN_READONLY, (err) => {

                strictEqual(err instanceof Error, true);
                throws(() => {
                    missing.run("select 1");
                });
                throws(() => {
                    missing.close();
                });
                resolve();

            });

            strictEqual(missing.filename.includes("missing.sqlite"), true);

        });

        throws(() => {
            return new dialect.Database(join(root, "missing-sync.sqlite"), dialect.OPEN_READONLY);
        });

    });

});
