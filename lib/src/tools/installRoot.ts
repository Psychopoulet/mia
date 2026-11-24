// deps

    // natives
    import { dirname, join } from "node:path";

// consts

    // lib/src/tools sits three directories under the repository root
    const SOURCE_ROOT: string = join(__dirname, "..", "..", "..");

// module

export default function installRoot (): string {

    // a compiled binary's __dirname is the virtual /$bunfs tree
    return Bun.isStandaloneExecutable ? dirname(process.execPath) : SOURCE_ROOT;

}
