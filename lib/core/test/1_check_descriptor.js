// deps

    // natives
    const { join } = require("node:path");
    const { readFile, lstat } = require("node:fs/promises");
    const { equal } = require("node:assert");

// consts

    const DESCRIPTOR_FILE = join(__dirname, "..", "lib", "data", "Descriptor.json");
    const DESCRIPTOR_EVENTS_FILE = join(__dirname, "..", "lib", "data", "DescriptorEvents.json");
    const PACKAGE_FILE = join(__dirname, "..", "package.json");

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

});
