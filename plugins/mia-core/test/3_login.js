// deps

    // natives
    const { join } = require("node:path");
    const { mkdtemp, readFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { strictEqual, rejects } = require("node:assert");

    // locals
    const {
        installStubs,
        resetStubs,
        stubs,
        createContainer
    } = require("./helpers/mediatorHarness");

    installStubs();

    const Mediator = require("../lib/cjs/Mediator.js").default;
    const { NotFoundError } = require("node-pluginsmanager-plugin");

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const MAX_TIMEOUT = 10000;

// tests

describe("login", () => {

    let descriptor = null;
    let mediator = null;
    let createdToken = null;

    before(() => {

        return readFile(DESCRIPTOR_FILE, "utf-8").then((content) => {

            descriptor = JSON.parse(content);

            return mkdtemp(join(tmpdir(), "mia-core-login-"));

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
        createdToken = null;

        stubs.tokenCreate = (payload) => {
            createdToken = payload;
            return Promise.resolve();
        };

    });

    after(() => {

        return mediator._releaseWorkSpace();

    });

    it("should return a token when credentials are valid", () => {

        const url = {
            "headers": {
                "user-agent": "mocha"
            }
        };

        return mediator.login(url, {
            "name": "admin",
            "password": "admin"
        }).then((token) => {

            strictEqual(token, "jwt-admin");
            strictEqual(createdToken.idUser, 1);
            strictEqual(createdToken.token, "jwt-admin");
            strictEqual(createdToken.fingerprint, "mocha");

        });

    }).timeout(MAX_TIMEOUT);

    it("should reject NotFoundError when credentials are invalid", () => {

        stubs.getByNameAndPassword = () => {
            return Promise.resolve(null);
        };

        return rejects(
            () => {
                return mediator.login({
                    "headers": {
                        "user-agent": "mocha"
                    }
                }, {
                    "name": "nope",
                    "password": "nope"
                });
            },
            (err) => {
                strictEqual(err instanceof NotFoundError, true);
                strictEqual(err.message, "Invalid credentials");
                return true;
            }
        );

    }).timeout(MAX_TIMEOUT);

});
