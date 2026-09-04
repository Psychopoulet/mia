// deps

    // natives
    const { join } = require("node:path");
    const { readFile, lstat } = require("node:fs/promises");
    const { equal } = require("node:assert");

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const DESCRIPTOR_EVENTS_FILE = join(__dirname, "..", "lib", "data", "DescriptorEvents.json");
    const PACKAGE_FILE = join(__dirname, "..", "package.json");
    const MIA_PACKAGE_FILE = join(__dirname, "..", "..", "..", "package.json");

    const POSTFIX_EVENTS_NAME = " - events";
    const POSTFIX_EVENTS_DESCRIPTION = " Events description.";

// tests

describe("check descriptor", () => {

    it("should check files existence", async () => {

        const descriptorStats = await lstat(DESCRIPTOR_FILE);
        const descriptorEventsStats = await lstat(DESCRIPTOR_EVENTS_FILE);
        const packageStats = await lstat(PACKAGE_FILE);

        equal(packageStats.isFile(), true, "Package file does not exist");
        equal(descriptorStats.isFile(), true, "Descriptor file does not exist");
        equal(descriptorEventsStats.isFile(), true, "DescriptorEvents file does not exist");

    });

    it("should match with package.json", async () => {

        const packageFile = JSON.parse(await readFile(PACKAGE_FILE, "utf-8"));
        const descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        const descriptorEvents = JSON.parse(await readFile(DESCRIPTOR_EVENTS_FILE, "utf-8"));

        equal(descriptor.info.version, packageFile.version, "Descriptor version does not match with package.json version");
        equal(descriptor.info.title, packageFile.name, "Descriptor title does not match with package.json name");
        equal(descriptor.info.description, packageFile.description, "Descriptor title does not match with package.json name");

        equal(descriptorEvents.info.version, packageFile.version, "DescriptorEvents version does not match with package.json version");
        equal(descriptorEvents.info.title, packageFile.name + POSTFIX_EVENTS_NAME, "DescriptorEvents title does not match with package.json name");
        equal(descriptorEvents.info.description, packageFile.description + POSTFIX_EVENTS_DESCRIPTION, "DescriptorEvents title does not match with package.json name");

    });

    it("should match version and description with mia package.json", async () => {

        const miaPackage = JSON.parse(await readFile(MIA_PACKAGE_FILE, "utf-8"));
        const packageFile = JSON.parse(await readFile(PACKAGE_FILE, "utf-8"));
        const descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        const descriptorEvents = JSON.parse(await readFile(DESCRIPTOR_EVENTS_FILE, "utf-8"));

        equal(packageFile.version, miaPackage.version, "package.json version does not match with mia package.json version");
        equal(packageFile.description, miaPackage.description, "package.json description does not match with mia package.json description");

        equal(descriptor.info.version, miaPackage.version, "Descriptor version does not match with mia package.json version");
        equal(descriptor.info.description, miaPackage.description, "Descriptor description does not match with mia package.json description");

        equal(descriptorEvents.info.version, miaPackage.version, "DescriptorEvents version does not match with mia package.json version");
        equal(descriptorEvents.info.description, miaPackage.description + POSTFIX_EVENTS_DESCRIPTION, "DescriptorEvents description does not match with mia package.json description");

    });

    it("should expose getPluginDescriptor on /mia-core/api/descriptor", async () => {

        const descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        const route = descriptor.paths["/mia-core/api/descriptor"];

        equal(Boolean(route), true, "Missing path /mia-core/api/descriptor");
        equal(route.get.operationId, "getPluginDescriptor");

    });

    it("should expose users and tokens operationIds under /mia-core and omit /mia-users-management", async () => {

        const descriptor = JSON.parse(await readFile(DESCRIPTOR_FILE, "utf-8"));
        const paths = descriptor.paths;

        equal(paths["/mia-core/api/users"].get.operationId, "getUsers");
        equal(paths["/mia-core/api/users"].put.operationId, "createUser");
        equal(paths["/mia-core/api/users/{name}"].get.operationId, "getUser");
        equal(paths["/mia-core/api/users/{name}"].post.operationId, "updateUser");
        equal(paths["/mia-core/api/users/{name}"].delete.operationId, "deleteUser");
        equal(paths["/mia-core/api/users/{name}/tokens"].get.operationId, "getUserTokens");
        equal(paths["/mia-core/api/tokens"].delete.operationId, "deleteToken");

        const leftover = Object.keys(paths).filter((path) => {
            return path.startsWith("/mia-users-management");
        });

        equal(leftover.length, 0, leftover.join(", "));

    });

});
