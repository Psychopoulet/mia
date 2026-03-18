"use strict";
// deps
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = managePlugins;
// externals
const node_pluginsmanager_1 = __importDefault(require("node-pluginsmanager"));
// module
function managePlugins(container) {
    const logger = container.get("log");
    const pluginsManager = new node_pluginsmanager_1.default({
        "directory": container.get("plugins-directory"),
        "externalResourcesDirectory": container.get("data-directory"),
        "logger": (type, message) => {
            const msg = message.message ? message.message : message;
            switch (type) {
                case "info":
                    return logger.info(msg);
                case "success":
                    return logger.success(msg);
                case "warning":
                    return logger.warning(msg);
                case "error":
                    return logger.error(msg);
                // "data"
                // "debug"
                // "log"
                default:
                    return logger.debug(msg);
            }
        }
    });
    container
        .set("plugins-manager", pluginsManager)
        .document("plugins-manager", "The application's plugin manager (instance of 'node-pluginsmanager' package)");
    pluginsManager.on("error", (err) => {
        logger.error(err.message);
        logger.debug(err.stack);
    })
        .on("loaded", (plugin) => {
        logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") loaded");
    }).on("allloaded", () => {
        logger.success("All plugins loaded");
    })
        .on("initialized", (plugin) => {
        logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") initialized");
    }).on("allinitialized", () => {
        logger.success("All plugins initialized");
    })
        .on("released", (plugin) => {
        logger.debug("Plugin " + plugin.name + " (v" + plugin.version + ") released");
    }).on("allreleased", () => {
        logger.warning("All plugins released");
    })
        .on("destroyed", (pluginName) => {
        logger.warning("Plugin " + pluginName + " destroyed");
    }).on("alldestroyed", () => {
        logger.warning("All plugins destroyed");
    })
        .on("updated", (plugin) => {
        logger.success("Plugin " + plugin.name + " (v" + plugin.version + ") success");
    })
        .on("installed", (plugin) => {
        logger.success("Plugin " + plugin.name + " (v" + plugin.version + ") installed");
    }).on("uninstalled", (plugin) => {
        logger.warning("Plugin " + plugin.name + " (v" + plugin.version + ") uninstalled");
    });
    return pluginsManager.loadAll(container).then(() => {
        return pluginsManager.initAll(container);
    });
}
