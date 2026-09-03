// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, rejects } = require("node:assert");

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

describe("getPluginLatestTag", () => {

    let descriptor = null;
    let resourcesDir = "";

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-tag-"));

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

    it("should reject NotFoundError when plugin is missing", () => {

        const pluginsManager = createPluginsManager([]);

        return createMediator(pluginsManager).then((mediator) => {

            return rejects(
                () => {
                    return mediator.getPluginLatestTag({
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
                return mediator._releaseWorkSpace();
            });

        });

    }).timeout(MAX_TIMEOUT);

    it("should return the latest GitHub tag string", () => {

        const pluginsManager = createPluginsManager([ fakePlugin("mia-core") ]);

        return createMediator(pluginsManager).then((mediator) => {

            return mediator.getPluginLatestTag({
                "path": {
                    "name": "mia-core"
                }
            }).then((tag) => {

                strictEqual(tag, "1.2.3");

                return mediator._releaseWorkSpace();

            });

        });

    }).timeout(MAX_TIMEOUT);

});
