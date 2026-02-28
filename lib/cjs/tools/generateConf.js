"use strict";
/*
    eslint-disable n/no-process-env
*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateConf;
// deps
// natives
const node_path_1 = require("node:path");
// externals
const node_confmanager_1 = __importDefault(require("node-confmanager"));
// module
function generateConf(container) {
    const confFile = (0, node_path_1.join)(container.get("data-directory"), "conf.json");
    const confManager = new node_confmanager_1.default(confFile);
    container
        .set("conf", confManager)
        .document("conf", "The application's configuration (instance of 'node-confmanager' package)");
    confManager.skeleton("port", "integer");
    confManager.skeleton("debug", "boolean");
    return confManager.fileExists().then((exists) => {
        if (!exists) {
            container.get("log").warning("Conf file not detected, create one at " + confFile);
            confManager.set("port", 8000);
            confManager.set("debug", true);
            return confManager.save();
        }
        else {
            return confManager.load();
        }
    }).then(() => {
        if (!confManager.get("debug")) {
            process.env.NODE_ENV = "production";
        }
    });
}
