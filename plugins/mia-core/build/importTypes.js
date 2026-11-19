// deps

    // natives
    const { join, relative, dirname } = require("node:path");
    const { readFile, rm, mkdir, copyFile, stat } = require("node:fs/promises");

// consts

    const PLUGIN_DIR = join(__dirname, "..");
    const MEDIATOR_FILE = join(PLUGIN_DIR, "lib", "src", "Mediator.ts");
    const TYPES_DIR = join(PLUGIN_DIR, "lib", "src", "types");

    const MIA_CJS_DIR = join(PLUGIN_DIR, "..", "..", "lib", "cjs");

    const REQUIRE_PATTERN = /require\(\s*"([^"]+)"\s*\)/g;
    const SRC_PREFIX = "../../../../lib/src/";

// module

async function importTypes () {

    // 1 — clean types directory

    await rm(TYPES_DIR, { "recursive": true, "force": true });
    await mkdir(TYPES_DIR, { "recursive": true });

    // 2 — parse Mediator.ts require() calls pointing to host MIA TypeScript sources

    const mediatorContent = await readFile(MEDIATOR_FILE, "utf-8");
    const sourcePaths = new Set();

    let match;
    while ((match = REQUIRE_PATTERN.exec(mediatorContent)) !== null) {

        const requirePath = match[1];

        if (requirePath.startsWith(SRC_PREFIX)) {
            sourcePaths.add(requirePath.slice(SRC_PREFIX.length).replace(/\.c?ts$/, ""));
        }

    }

    if (0 >= sourcePaths.size) {
        console.log("[importTypes] No host require() found in Mediator.ts — nothing to import.");
        return;
    }

    // 3 — copy each matching .d.ts into lib/src/types, preserving sub-paths

    let imported = 0;

    for (const sourceRelative of sourcePaths) {

        const dtsSource = join(MIA_CJS_DIR, sourceRelative + ".d.ts");

        // check that the .d.ts actually exists in host build output
        try {
            await stat(dtsSource);
        }
        catch {
            console.warn("[importTypes] WARNING — missing .d.ts: " + dtsSource);
            continue;
        }

        const dtsTarget = join(TYPES_DIR, sourceRelative + ".d.ts");

        await mkdir(dirname(dtsTarget), { "recursive": true });
        await copyFile(dtsSource, dtsTarget);

        console.log("[importTypes] " + relative(PLUGIN_DIR, dtsTarget));
        ++imported;

    }

    console.log("[importTypes] Done — " + imported + " type file(s) imported.");

}

importTypes().catch((err) => {
    console.error("[importTypes] FATAL", err);
    process.exitCode = 1;
});
