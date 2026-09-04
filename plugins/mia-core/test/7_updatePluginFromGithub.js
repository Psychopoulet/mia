// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, deepStrictEqual, rejects } = require("node:assert");

    // locals
    const {
        installStubs,
        createContainer,
        createPluginsManager,
        fakePlugin
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;
    const { NotFoundError } = require("node-pluginsmanager-plugin");

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("updatePluginFromGithub", () => {

    let descriptor = null;
    let resourcesDir = "";

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-update-"));

        }).then((created) => {

            resourcesDir = created;

        });

    });

    function createMediator (pluginsManager) {

        const mediator = new Mediator({
            "descriptor": descriptor,
            "externalResourcesDirectory": resourcesDir
        });

        return mediator._initWorkSpace(createContainer({
            pluginsManager
        })).then(() => {
            return mediator;
        });

    }

    it("should reject NotFoundError and emit update-fail when plugin is missing", () => {

        const pluginsManager = createPluginsManager([]);
        let failData = null;

        return createMediator(pluginsManager).then((mediator) => {

            mediator.on("plugin-update-fail", (data) => {
                failData = data;
            });

            return rejects(
                () => {
                    return mediator.updatePluginFromGithub({
                        "path": {
                            "name": "mia-core"
                        }
                    });
                },
                (err) => {
                    strictEqual(err instanceof NotFoundError, true);
                    strictEqual(err.message, "Plugin \"mia-core\" not found");
                    return true;
                }
            ).then(() => {

                deepStrictEqual(failData, {
                    "pluginName": "mia-core",
                    "error": "Plugin \"mia-core\" not found"
                });

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

    it("should emit update-running on success", () => {

        const pluginsManager = createPluginsManager([ fakePlugin("mia-core") ]);
        const emitted = [];

        return createMediator(pluginsManager).then((mediator) => {

            mediator.on("plugin-update-running", (data) => {
                emitted.push(data);
            });

            return mediator.updatePluginFromGithub({
                "path": {
                    "name": "mia-core"
                }
            }).then(() => {

                deepStrictEqual(emitted, [ "mia-core" ]);

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

    it("should emit update-fail when updateViaGithub rejects", () => {

        const pluginsManager = createPluginsManager([ fakePlugin("mia-core") ]);

        pluginsManager.updateViaGithub = () => {
            return Promise.reject(new Error("update boom"));
        };

        return createMediator(pluginsManager).then((mediator) => {

            let failData = null;

            mediator.on("plugin-update-fail", (data) => {
                failData = data;
            });

            return rejects(
                () => {
                    return mediator.updatePluginFromGithub({
                        "path": {
                            "name": "mia-core"
                        }
                    });
                },
                (err) => {
                    strictEqual(err.message, "update boom");
                    return true;
                }
            ).then(() => {

                deepStrictEqual(failData, {
                    "pluginName": "mia-core",
                    "error": "update boom"
                });

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

});
