"use strict";
// deps
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = registerAppData;
// natives
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
// module
function registerAppData(container) {
    return new Promise((resolve, reject) => {
        const packageFile = (0, node_path_1.join)(__dirname, "..", "..", "..", "package.json");
        return (0, node_fs_1.readFile)(packageFile, "utf-8", (err, content) => {
            return err ? reject(err) : resolve(JSON.parse(content));
        });
    }).then((packageData) => {
        container
            .skeleton("app", "object")
            .document("app", "Application's data (extracted from package.json)");
        container
            .skeleton("app.name", "string")
            .set("app.name", packageData.name)
            .document("app.name", "Application's name")
            .skeleton("app.version", "string")
            .set("app.version", packageData.version)
            .document("app.version", "Application's version")
            .skeleton("app.description", "string")
            .set("app.description", packageData.description)
            .document("app.description", "Application's description");
        container
            .skeleton("data-directory", "string")
            .set("data-directory", (0, node_path_1.join)((0, node_os_1.homedir)(), container.get("app.name"), "data"))
            .document("data-directory", "Where the application's data are registered")
            .skeleton("plugins-data-directory", "string")
            .set("plugins-data-directory", (0, node_path_1.join)((0, node_os_1.homedir)(), container.get("app.name"), "data", "plugins"))
            .document("plugins-data-directory", "Where the application's plugins data are registered")
            .skeleton("plugins-directory", "string")
            .set("plugins-directory", (0, node_path_1.join)((0, node_os_1.homedir)(), container.get("app.name"), "plugins"))
            .document("plugins-directory", "Where the application's plugins are stored and executed");
        container
            .skeleton("conf-file", "string")
            .set("conf-file", (0, node_path_1.join)(container.get("data-directory"), "conf.json"))
            .document("conf-file", "The application's file where the configuration is registered")
            .skeleton("logs-file", "string")
            .set("logs-file", (0, node_path_1.join)(container.get("data-directory"), "logs.txt"))
            .document("logs-file", "The application's file where the logs are registered");
    });
}
