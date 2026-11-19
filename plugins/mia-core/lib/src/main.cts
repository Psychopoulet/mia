/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
// Bun rejects an `import` next to `export =` ("Cannot use import statement with CommonJS-only features").

import type OrchestratorCore from "./Orchestrator";

const Orchestrator: typeof OrchestratorCore = (require("./Orchestrator") as { "default": typeof OrchestratorCore }).default;

export = Orchestrator;
