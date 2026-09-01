// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { deepStrictEqual } = require("node:assert");

    // locals
    const {
        installStubs,
        createContainer,
        createPluginsManager,
        fakePlugin
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("getPlugins", () => {

    let descriptor = null;
    let mediator = null;

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-plugins-"));

        }).then((resourcesDir) => {

            mediator = new Mediator({
                "descriptor": descriptor,
                "externalResourcesDirectory": resourcesDir
            });

            const plugin = fakePlugin("mia-core");
            const pluginsManager = createPluginsManager([ plugin ]);

            return mediator._initWorkSpace(createContainer({
                pluginsManager
            }));

        });

    });

    after(() => {

        return mediator._releaseWorkSpace();

    });

    it("should map plugins-manager plugins to schema Plugin", () => {

        return mediator.getPlugins().then((plugins) => {

            deepStrictEqual(plugins, [
                {
                    "name": "mia-core",
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
                }
            ]);

        });

    }).timeout(MAX_TIMEOUT);

});
