// deps

    // natives
    const { join } = require("node:path");
    const { mkdir, mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual } = require("node:assert");

    // locals
    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const DIST_DIR = join(__dirname, "..", "public", "dist");
    const BUNDLE_FILE = join(DIST_DIR, "bundle.min.js");
    const MAP_FILE = join(DIST_DIR, "bundle.min.js.map");
    const MAX_TIMEOUT = 10000;

// tests

describe("mediator", () => {

    let descriptor = null;
    let resourcesDir = "";
    let mediator = null;

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-template-"));

        }).then((created) => {

            resourcesDir = created;

            return mkdir(DIST_DIR, {
                "recursive": true
            });

        }).then(() => {

            return writeFile(BUNDLE_FILE, "{{plugin.name}}|{{plugin.version}}|{{plugin.description}}", "utf-8");

        }).then(() => {

            return writeFile(MAP_FILE, "sourcemap", "utf-8");

        });

    });

    beforeEach(() => {

        mediator = new Mediator({
            "descriptor": descriptor,
            "externalResourcesDirectory": resourcesDir
        });

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
            rm(MAP_FILE, {
                "force": true
            })
        ]);

    });

    it("should init and release workspace", () => {

        return mediator._initWorkSpace().then(() => {

            return mediator._releaseWorkSpace();

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

    it("should return front app sourcemap", () => {

        return mediator.getFrontAppMap().then((content) => {

            strictEqual(content, "sourcemap");

        });

    }).timeout(MAX_TIMEOUT);

});
