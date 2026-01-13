"use strict";
// deps
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ensureAppDirectories;
// natives
const node_fs_1 = require("node:fs");
// module
function ensureAppDirectories(container) {
    const dataDir = container.get("data-directory");
    return new Promise((resolve) => {
        return (0, node_fs_1.stat)(dataDir, (err, stats) => {
            return Boolean(err) || !stats.isDirectory() ? resolve(false) : resolve(true);
        });
    }).then((result) => {
        return new Promise((resolve, reject) => {
            if (result) {
                return resolve();
            }
            container.get("log").warning("App data directory not detected, create one at " + dataDir);
            return (0, node_fs_1.mkdir)(dataDir, {
                "recursive": true
            }, (err) => {
                return err ? reject(err) : resolve();
            });
        });
    });
}
