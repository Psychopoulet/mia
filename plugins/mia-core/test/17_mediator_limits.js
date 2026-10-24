// deps

    // natives
    const { deepStrictEqual } = require("node:assert");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");

    // locals
    const {
        installStubs,
        resetStubs,
        restoreStubs,
        createContainer
    } = require("./helpers/mediatorHarness");

installStubs();

const Mediator = require("../lib/src/Mediator.ts").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");

// tests

describe("mediator limits", () => {

    let descriptor = null;
    let resourcesDir = "";

    before(async () => {

        descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        resourcesDir = await mkdtemp(join(tmpdir(), "mia-core-limits-"));

    });

    after(() => {
        restoreStubs();
    });

    it("should return log bounds and the known levels", async () => {

        resetStubs();

        const mediator = new Mediator({
            "descriptor": descriptor,
            "externalResourcesDirectory": resourcesDir
        });

        await mediator._initWorkSpace(createContainer());

        const limits = await mediator.getLogsLimits();
        const levels = await mediator.getLogsLevels();

        deepStrictEqual(limits, {
            "newest": "2024-03-02T00:00:00.000Z",
            "oldest": "2024-03-01T00:00:00.000Z"
        });
        deepStrictEqual(levels, [
            "critical",
            "error",
            "warning",
            "success",
            "info",
            "debug"
        ]);

        await mediator._releaseWorkSpace();

    });

});
