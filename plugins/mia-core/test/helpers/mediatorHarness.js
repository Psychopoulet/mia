// deps

    // natives
    const Module = require("node:module");
    const { EventEmitter } = require("node:events");

// consts

    const originalLoad = Module._load;

    function defaultStubs () {

        return {
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
            "userFindAll": () => {
                return Promise.resolve([]);
            },
            "userFindOne": () => {
                return Promise.resolve(null);
            },
            "userCreate": () => {
                return Promise.resolve(null);
            },
            "userCount": () => {
                return Promise.resolve(0);
            },
            "tokenCreate": () => {
                return Promise.resolve();
            },
            "tokenDestroy": () => {
                return Promise.resolve(1);
            },
            "tokenGetUserByToken": () => {
                return Promise.resolve();
            },
            "tokenGetByUserName": () => {
                return Promise.resolve([]);
            },
            "logCountInRange": () => {
                return Promise.resolve(0);
            },
            "logFindInRange": () => {
                return Promise.resolve([]);
            },
            "logDestroyInRange": () => {
                return Promise.resolve(0);
            }
        };

    }

    const stubs = defaultStubs();

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
                        },
                        "findAll": (...args) => {
                            return stubs.userFindAll(...args);
                        },
                        "findOne": (...args) => {
                            return stubs.userFindOne(...args);
                        },
                        "create": (...args) => {
                            return stubs.userCreate(...args);
                        },
                        "count": (...args) => {
                            return stubs.userCount(...args);
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
                        },
                        "getUserByToken": (...args) => {
                            return stubs.tokenGetUserByToken(...args);
                        },
                        "getByUserName": (...args) => {
                            return stubs.tokenGetByUserName(...args);
                        }
                    }
                };
            }

            if (normalized.endsWith("cjs/tools/models/Log")) {
                return {
                    "__esModule": true,
                    "default": {
                        "countInRange": (...args) => {
                            return stubs.logCountInRange(...args);
                        },
                        "findInRange": (...args) => {
                            return stubs.logFindInRange(...args);
                        },
                        "destroyInRange": (...args) => {
                            return stubs.logDestroyInRange(...args);
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

        Object.assign(stubs, defaultStubs());

    }

    // back the User / Token stubs with an in-memory store (see authStoreHarness)
    function useAuthStore (store) {

        stubs.userFindAll = store.User.findAll;
        stubs.userFindOne = store.User.findOne;
        stubs.userCreate = store.User.create;
        stubs.userCount = store.User.count;

        stubs.tokenGetUserByToken = store.Token.getUserByToken;
        stubs.tokenGetByUserName = store.Token.getByUserName;
        stubs.tokenDestroy = store.Token.destroy;

    }

// module

module.exports = {
    stubs,
    installStubs,
    restoreStubs,
    resetStubs,
    useAuthStore,
    createContainer,
    createPluginsManager,
    fakePlugin
};
