// deps

    // natives
    const Module = require("node:module");
    const { EventEmitter } = require("node:events");

// consts

    const originalLoad = Module._load;

    const stubs = {
        "sign": (name) => {
            return Promise.resolve("jwt-" + name);
        },
        "extractToken": () => {
            return "bearer-token";
        },
        "getByNameAndPassword": () => {
            return Promise.resolve({
                "id": 1,
                "name": "admin"
            });
        },
        "tokenCreate": () => {
            return Promise.resolve();
        },
        "tokenDestroy": () => {
            return Promise.resolve(1);
        }
    };

// private

    function normalize (request) {
        return String(request).replace(/\\/gu, "/");
    }

    function fakePlugin (name) {

        return {
            "name": name,
            "version": "1.0.0",
            "description": "plugin description",
            "enabled": true,
            "dependencies": {},
            "engines": {
                "node": "22.0.0"
            },
            "authors": [ "author" ],
            "license": "ISC",
            "repository": "https://github.com/Psychopoulet/mia-core"
        };

    }

    function createPluginsManager (pluginList) {

        const manager = new EventEmitter();

        manager.plugins = pluginList ?? [ fakePlugin("mia-core") ];

        manager.installViaGithub = () => {
            return Promise.resolve(fakePlugin("mia-core"));
        };

        manager.updateViaGithub = () => {
            return Promise.resolve();
        };

        manager.uninstall = () => {
            return Promise.resolve("mia-core");
        };

        manager.getLatestGithubTag = () => {
            return Promise.resolve("1.2.3");
        };

        return manager;

    }

    function createContainer (options) {

        const pluginsManager = options?.pluginsManager ?? createPluginsManager();

        const store = {
            "plugins-manager": pluginsManager,
            "app.name": "mia-core",
            "app.version": "1.0.0",
            "app.description": "MIA core plugin — authentication, plugin lifecycle, and the main web UI.",
            "conf": {
                "get": () => {
                    return "test-secret";
                }
            }
        };

        return {
            "get": (key) => {
                return store[key];
            },
            "set": (key, value) => {
                store[key] = value;
            }
        };

    }

    function installStubs () {

        Module._load = function _load (request, parent, isMain) {

            const normalized = normalize(request);

            if (normalized.endsWith("cjs/tools/AuthJWT")) {
                return {
                    "sign": (...args) => {
                        return stubs.sign(...args);
                    }
                };
            }

            if (normalized.endsWith("cjs/tools/extractToken")) {
                return {
                    "__esModule": true,
                    "default": (...args) => {
                        return stubs.extractToken(...args);
                    }
                };
            }

            if (normalized.endsWith("cjs/tools/models/User")) {
                return {
                    "__esModule": true,
                    "default": {
                        "getByNameAndPassword": (...args) => {
                            return stubs.getByNameAndPassword(...args);
                        }
                    }
                };
            }

            if (normalized.endsWith("cjs/tools/models/Token")) {
                return {
                    "__esModule": true,
                    "default": {
                        "create": (...args) => {
                            return stubs.tokenCreate(...args);
                        },
                        "destroy": (...args) => {
                            return stubs.tokenDestroy(...args);
                        }
                    }
                };
            }

            return originalLoad.call(this, request, parent, isMain);

        };

    }

    function restoreStubs () {
        Module._load = originalLoad;
    }

    function resetStubs () {

        stubs.sign = (name) => {
            return Promise.resolve("jwt-" + name);
        };

        stubs.extractToken = () => {
            return "bearer-token";
        };

        stubs.getByNameAndPassword = () => {
            return Promise.resolve({
                "id": 1,
                "name": "admin"
            });
        };

        stubs.tokenCreate = () => {
            return Promise.resolve();
        };

        stubs.tokenDestroy = () => {
            return Promise.resolve(1);
        };

    }

// module

module.exports = {
    stubs,
    installStubs,
    restoreStubs,
    resetStubs,
    createContainer,
    createPluginsManager,
    fakePlugin
};
