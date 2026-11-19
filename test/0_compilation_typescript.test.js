// deps

    // natives
    const { exec } = require("node:child_process");
    const { join } = require("node:path");
    const { unlink } = require("node:fs/promises");
    const { lstat } = require("node:fs");

// tests

describe("compilation typescript", () => {

    const compilationSource = join(__dirname, "typescript", "compilation.cts");
    const compilationTarget = join(__dirname, "typescript", "compilation.cjs");

    beforeAll(() => {

        return new Promise((resolve) => {

            lstat(compilationTarget, (err, stats) => {
                return resolve(Boolean(!err && stats.isFile()));
            });

        }).then((exists) => {
            return exists ? unlink(compilationTarget) : Promise.resolve();
        });

    });

    afterAll(() => {

        return new Promise((resolve) => {

            lstat(compilationTarget, (err, stats) => {
                return resolve(Boolean(!err && stats.isFile()));
            });

        }).then((exists) => {
            return exists ? unlink(compilationTarget) : Promise.resolve();
        });

    });

    it("should compile typescript file", () => {

        return new Promise((resolve, reject) => {

            const args = [
                "bunx tsc",
                compilationSource,
                "--target es6",
                "--module commonjs",
                "--esModuleInterop"
            ];

            exec(args.join(" "), {
                "cwd": join(__dirname, ".."),
                "windowsHide": true
            }, (err) => {
                return err ? reject(err) : resolve();
            });

        });

    });

    it("should exec compiled typescript file", (done) => {

        const args = [
            "bun",
            compilationTarget
        ];

        exec(args.join(" "), {
            "cwd": join(__dirname, ".."),
            "windowsHide": true
        }, (err) => {
            return err ? done(err) : done();
        });

    });

});
