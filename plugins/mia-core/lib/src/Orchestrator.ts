// deps

    // natives
    import { join } from "node:path";

    // externals
    import { Orchestrator } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { iOrchestratorOptions } from "node-pluginsmanager-plugin";

// module

export default class OrchestratorCore extends Orchestrator {

    public constructor (data: iOrchestratorOptions) {

        super({
            ...data,
            "packageFile": join(__dirname, "..", "..", "package.json"),
            "descriptorFile": join(__dirname, "..", "data", "Descriptor.json"),
            "mediatorFile": join(__dirname, "Mediator.js"),
            "serverFile": join(__dirname, "Server.js")
        });

    }

}
