// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual } = require("node:assert");

    // locals
    const {
        installStubs,
        resetStubs,
        stubs,
        createContainer
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("logout", () => {

    let descriptor = null;
    let mediator = null;
    let destroyedWhere = null;

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-logout-"));

        }).then((resourcesDir) => {

            mediator = new Mediator({
                "descriptor": descriptor,
                "externalResourcesDirectory": resourcesDir
            });

            return mediator._initWorkSpace(createContainer());

        });

    });

    beforeEach(() => {

        resetStubs();
        destroyedWhere = null;

        stubs.extractToken = () => {
            return "session-token";
        };

        stubs.tokenDestroy = (query) => {
            destroyedWhere = query;
            return Promise.resolve(1);
        };

    });

    after(() => {

        return mediator._releaseWorkSpace();

    });

    it("should destroy the extracted bearer token", () => {

        return mediator.logout({
            "headers": {
                "authorization": "Bearer session-token"
            }
        }).then(() => {

            strictEqual(destroyedWhere.where.token, "session-token");

        });

    }).timeout(MAX_TIMEOUT);

    it("should fall back on empty headers when none is provided", () => {

        let receivedHeaders = null;

        stubs.extractToken = (request) => {
            receivedHeaders = request.headers;
            return "session-token";
        };

        return mediator.logout({}).then(() => {

            strictEqual(typeof receivedHeaders, "object");
            strictEqual(Object.keys(receivedHeaders).length, 0);
            strictEqual(destroyedWhere.where.token, "session-token");

        });

    }).timeout(MAX_TIMEOUT);

});
