// deps

    // natives
    const { rejects, strictEqual, throws } = require("node:assert");
    const { join } = require("node:path");

    // locals
    const getCaller = require(join(__dirname, "..", "lib", "src", "utils", "getCaller.ts")).default;
    const getFingerprint = require(join(__dirname, "..", "lib", "src", "utils", "getFingerprint.ts")).default;
    const parseGithubPath = require(join(__dirname, "..", "lib", "src", "utils", "parseGithubPath.ts")).default;
    const { toIsoDate } = require(join(__dirname, "..", "lib", "src", "utils", "serializeAuth.ts"));

// tests

describe("coverage edges", () => {

    it("should ignore a non-string authorization header", () => {

        throws(() => {

            getCaller(() => {
                return Promise.resolve();
            }, {
                "headers": {
                    "authorization": 12
                }
            });

        }, {
            "message": "Missing Authorization header"
        });

    });

    it("should ignore an authorization header whose first value is not a string", () => {

        throws(() => {

            getCaller(() => {
                return Promise.resolve();
            }, {
                "headers": {
                    "authorization": [ 12 ]
                }
            });

        }, {
            "message": "Missing Authorization header"
        });

    });

    it("should read a fingerprint from a user-agent list", () => {

        strictEqual(getFingerprint(), "No user agent");
        strictEqual(getFingerprint({}), "No user agent");
        strictEqual(getFingerprint({
            "user-agent": []
        }), "No user agent");
        strictEqual(getFingerprint({
            "user-agent": [ 1, "Mia/1.0" ]
        }), "Mia/1.0");
        strictEqual(getFingerprint({
            "user-agent": [ 1 ]
        }), "No user agent");

    });

    it("should reject a github path that is not a repository", () => {

        throws(() => {
            parseGithubPath("not-a-repo");
        }, {
            "message": "Invalid GitHub repository path"
        });

    });

    it("should format string dates and keep unparsable values", () => {

        strictEqual(toIsoDate("2024-03-01T00:00:00.000Z"), "2024-03-01T00:00:00.000Z");
        strictEqual(toIsoDate("not-a-date"), "not-a-date");

    });

    it("should reject when the token lookup fails", () => {

        return rejects(() => {

            return getCaller(() => {
                return Promise.reject(new Error("lookup failed"));
            }, {
                "headers": {
                    "authorization": "Bearer tok"
                }
            });

        }, {
            "message": "lookup failed"
        });

    });

});
