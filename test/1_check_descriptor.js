// deps

    // natives
    const { join } = require("node:path");
    const { readFile } = require("node:fs/promises");
    const { equal } = require("node:assert");

// consts

    const POSTFIX_EVENTS_NAME = " - events";
    const POSTFIX_EVENTS_DESCRIPTION = " Events description.";

// tests

describe("check descriptor", () => {

    it("should match with package.json", async () => {

        const descriptor = JSON.parse(await readFile(join(__dirname, "..", "lib", "data", "Descriptor.json"), "utf-8"));
        const descriptorEvents = JSON.parse(await readFile(join(__dirname, "..", "lib", "data", "DescriptorEvents.json"), "utf-8"));
        const packageFile = JSON.parse(await readFile(join(__dirname, "..", "package.json"), "utf-8"));

        equal(descriptor.info.version, packageFile.version, "Descriptor version does not match with package.json version");
        equal(descriptor.info.title, packageFile.name, "Descriptor title does not match with package.json name");
        equal(descriptor.info.description, packageFile.description, "Descriptor title does not match with package.json name");

        equal(descriptorEvents.info.version, packageFile.version, "DescriptorEvents version does not match with package.json version");
        equal(descriptorEvents.info.title, packageFile.name + POSTFIX_EVENTS_NAME, "DescriptorEvents title does not match with package.json name");
        equal(descriptorEvents.info.description, packageFile.description + POSTFIX_EVENTS_DESCRIPTION, "DescriptorEvents title does not match with package.json name");


    });

});
