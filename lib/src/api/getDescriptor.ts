// deps

    // natives
    import { join } from "node:path";

    // externals
    import SwaggerParser from "@apidevtools/swagger-parser";

// types & interfaces

    // locals
    import type { operations } from "./Descriptor";

// module

export default function getDescriptor (): Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]> {

    const descriptorFile: string = join(__dirname, "..", "..", "data", "Descriptor.json");

    // generate descriptor (bundle + validate, same pattern as node-pluginsmanager-plugin Orchestrator)
    return SwaggerParser.bundle(descriptorFile).then((bundledDescriptor) => {

        // force validate because of stupid malformatted references
        return SwaggerParser.validate(bundledDescriptor).then((validatedDescriptor) => {

            const descriptor = validatedDescriptor as {
                "servers"?: unknown[];
            };

            descriptor.servers ??= [];

            return descriptor as operations["getDescriptor"]["responses"]["200"]["content"]["application/json"];

        });

    });

}
