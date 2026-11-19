// deps

    // natives
    const { strictEqual } = require("node:assert");
    const { join } = require("node:path");

    // locals
    const main = require(join(__dirname, "..", "lib", "src", "main.cts"));
    const Orchestrator = require(join(__dirname, "..", "lib", "src", "Orchestrator.ts")).default;

// tests

describe("orchestrator", () => {

    it("should export the orchestrator", () => {

        const orchestrator = new Orchestrator({
            "externalResourcesDirectory": ""
        });

        strictEqual(main, Orchestrator, "main export is not the orchestrator");
        strictEqual(orchestrator instanceof Orchestrator, true, "constructed orchestrator is not the class");

    });

});
