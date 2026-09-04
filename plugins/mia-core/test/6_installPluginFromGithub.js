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
        createPluginsManager
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("installPluginFromGithub", () => {

    let descriptor = null;
    let resourcesDir = "";

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-install-"));

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

    it("should emit running then success for a valid GitHub path", () => {

        const pluginsManager = createPluginsManager();
        const emitted = [];

        return createMediator(pluginsManager).then((mediator) => {

            mediator.on("plugin-install-running", (data) => {
                emitted.push([ "running", data ]);
            });

            mediator.on("plugin-install-success", (data) => {
                emitted.push([ "success", data ]);
            });

            return mediator.installPluginFromGithub({}, {
                "path": "github.com/Psychopoulet/mia-core"
            }).then(() => {

                deepStrictEqual(emitted[0], [ "running", "mia-core" ]);
                deepStrictEqual(emitted[1], [ "success", "mia-core" ]);

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

    it("should emit install-fail and reject on error", () => {

        const pluginsManager = createPluginsManager();

        pluginsManager.installViaGithub = () => {
            return Promise.reject(new Error("install boom"));
        };

        return createMediator(pluginsManager).then((mediator) => {

            let failData = null;

            mediator.on("plugin-install-fail", (data) => {
                failData = data;
            });

            return rejects(
                () => {
                    return mediator.installPluginFromGithub({}, {
                        "path": "owner/repo"
                    });
                },
                (err) => {
                    strictEqual(err.message, "install boom");
                    return true;
                }
            ).then(() => {

                deepStrictEqual(failData, {
                    "pluginName": "owner/repo",
                    "error": "install boom"
                });

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

});
