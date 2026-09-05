// deps

    // natives
    const { join } = require("node:path");
    const { mkdir, mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual } = require("node:assert");

    // locals
    const {
        installStubs,
        createContainer
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const DIST_DIR = join(__dirname, "..", "public", "dist");
    const BUNDLE_FILE = join(DIST_DIR, "bundle.min.js");
    const BUNDLE_MAP_FILE = join(DIST_DIR, "bundle.min.js.map");
    const MENU_FILE = join(DIST_DIR, "menu.min.js");
    const MENU_MAP_FILE = join(DIST_DIR, "menu.min.js.map");
    const MAX_TIMEOUT = 10000;

// tests

describe("mediator", () => {

    let descriptor = null;
    let resourcesDir = "";
    let mediator = null;
    let container = null;

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-"));

        }).then((created) => {

            resourcesDir = created;

            return mkdir(DIST_DIR, {
                "recursive": true
            });

        }).then(() => {

            return Promise.all([
                writeFile(BUNDLE_FILE, "{{plugin.name}}|{{plugin.version}}|{{plugin.description}}", "utf-8"),
                writeFile(BUNDLE_MAP_FILE, "bundle-sourcemap", "utf-8"),
                writeFile(MENU_FILE, "{{plugin.name}}|{{plugin.version}}|{{plugin.description}}", "utf-8"),
                writeFile(MENU_MAP_FILE, "menu-sourcemap", "utf-8")
            ]);

        });

    });

    beforeEach(() => {

        container = createContainer();
        mediator = new Mediator({
            "descriptor": descriptor,
            "externalResourcesDirectory": resourcesDir
        });

        return mediator._initWorkSpace(container);

    });

    afterEach(() => {

        return mediator._releaseWorkSpace();

    });

    after(() => {

        return Promise.all([
            rm(resourcesDir, {
                "force": true,
                "recursive": true
            }),
            rm(BUNDLE_FILE, {
                "force": true
            }),
            rm(BUNDLE_MAP_FILE, {
                "force": true
            }),
            rm(MENU_FILE, {
                "force": true
            }),
            rm(MENU_MAP_FILE, {
                "force": true
            })
        ]);

    });

    describe("front files", () => {

        it("should init and release workspace", () => {

            strictEqual(Boolean(container.get("plugins-manager")), true);

        }).timeout(MAX_TIMEOUT);

        it("should release workspace twice without failing", () => {

            return mediator._releaseWorkSpace().then(() => {

                return mediator._releaseWorkSpace();

            }).then(() => {

                return mediator._initWorkSpace(container);

            });

        }).timeout(MAX_TIMEOUT);

        it("should replace plugin placeholders in front index", () => {

            return mediator.getFrontIndex().then((content) => {

                strictEqual(content.includes(descriptor.info.title), true);
                strictEqual(content.includes(descriptor.info.version), true);
                strictEqual(content.includes(descriptor.info.description), true);
                strictEqual(content.includes("{{plugin.name}}"), false);

            });

        }).timeout(MAX_TIMEOUT);

        it("should replace plugin placeholders in front app", () => {

            return mediator.getFrontApp().then((content) => {

                strictEqual(content, descriptor.info.title + "|" + descriptor.info.version + "|" + descriptor.info.description);

            });

        }).timeout(MAX_TIMEOUT);

        it("should replace plugin placeholders in front menu", () => {

            return mediator.getFrontMenu().then((content) => {

                strictEqual(content, descriptor.info.title + "|" + descriptor.info.version + "|" + descriptor.info.description);

            });

        }).timeout(MAX_TIMEOUT);

        it("should return front app sourcemap without placeholder replace", () => {

            return mediator.getFrontAppMap().then((content) => {

                strictEqual(content, "bundle-sourcemap");

            });

        }).timeout(MAX_TIMEOUT);

        it("should return front menu sourcemap without placeholder replace", () => {

            return mediator.getFrontMenuMap().then((content) => {

                strictEqual(content, "menu-sourcemap");

            });

        }).timeout(MAX_TIMEOUT);

    });

    describe("progress events", () => {

        it("should emit plugin-install-step from plugins-manager installing", () => {

            return new Promise((resolve, reject) => {

                mediator.on("plugin-install-step", (data) => {

                    try {
                        strictEqual(data.pluginName, "mia-core");
                        strictEqual(data.currentStep, 1);
                        strictEqual(data.maxSteps, 3);
                        strictEqual(data.stepMessage, "clone");
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }

                });

                container.get("plugins-manager").emit("installing", "mia-core", 1, 3, "clone");

            });

        }).timeout(MAX_TIMEOUT);

        it("should emit plugin-update-step from plugins-manager updating", () => {

            return new Promise((resolve, reject) => {

                mediator.on("plugin-update-step", (data) => {

                    try {
                        strictEqual(data.pluginName, "mia-core");
                        strictEqual(data.currentStep, 2);
                        strictEqual(data.maxSteps, 4);
                        strictEqual(data.stepMessage, "npm");
                        resolve();
                    }
                    catch (err) {
                        reject(err);
                    }

                });

                container.get("plugins-manager").emit("updating", "mia-core", 2, 4, "npm");

            });

        }).timeout(MAX_TIMEOUT);

    });

});
