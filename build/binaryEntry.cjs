// deps

    // natives
    const { existsSync, readFileSync, statSync } = require("node:fs");
    const Module = require("node:module");
    const { dirname, isAbsolute, join } = require("node:path");

// private

    // A compiled require() resolves a directory through index.js and ignores "main".
    function _namedExport (value, name) {

        if (!value || "object" !== typeof value) {
            return "";
        }

        const field = value[name];

        if ("string" === typeof field) {
            return field;
        }

        if (field && "string" === typeof field.default) {
            return field.default;
        }

        return "";

    }

    function _exportEntry (value, prefer) {

        if ("string" === typeof value) {
            return value;
        }

        if (!value || "object" !== typeof value) {
            return "";
        }

        if (value["."]) {
            return _exportEntry(value["."], prefer);
        }

        const names = "import" === prefer
            ? [ "import", "default", "require", "node", "bun" ]
            : [ "require", "default", "import", "node", "bun" ];

        for (let index = 0; index < names.length; index++) {

            const found = _namedExport(value, names[index]);

            if (found) {
                return found;
            }

        }

        return "";

    }

    function _fileFromDeclared (directory, entry) {

        const relative = entry.startsWith(".") ? entry : "./" + entry;
        const absolute = join(directory, relative);

        if (existsSync(absolute + ".js")) {
            return absolute + ".js";
        }

        if (existsSync(join(absolute, "index.js"))) {
            return join(absolute, "index.js");
        }

        if (!existsSync(absolute)) {
            return "";
        }

        return absolute;

    }

    function _directoryEntry (directory, prefer) {

        const manifest = join(directory, "package.json");

        if (!existsSync(manifest)) {
            return "";
        }

        const pkg = JSON.parse(readFileSync(manifest, "utf8"));
        const main = "string" === typeof pkg.main && "" !== pkg.main ? pkg.main : "";
        const exported = _exportEntry(pkg.exports, prefer);
        const declared = "import" === prefer ? (exported || main) : (main || exported);

        if (!declared) {
            return "";
        }

        return _fileFromDeclared(directory, declared);

    }

    function _packageEntry (request, parent, prefer) {

        if (isAbsolute(request)) {

            try {

                if (statSync(request).isDirectory()) {
                    return _directoryEntry(request, prefer);
                }

            }
            catch {
                return "";
            }

            return "";

        }

        if (!parent || !parent.filename || request.startsWith(".") || request.startsWith("node:") || request.startsWith("bun:")) {
            return "";
        }

        const bases = Module._nodeModulePaths(dirname(parent.filename));

        for (let index = 0; index < bases.length; index++) {

            const found = _directoryEntry(join(bases[index], request), prefer);

            if (found) {
                return found;
            }

        }

        return "";

    }

    const resolveFilename = Module._resolveFilename;

    Module._resolveFilename = function (request, parent) {

        try {
            return resolveFilename.apply(this, arguments);
        }
        catch (err) {

            const message = err && "string" === typeof err.message ? err.message : "";
            const prefer = message.includes("imported from") ? "import" : "require";
            let resolved = _packageEntry(request, parent, prefer);

            // The compiled resolver reports the real importer in the message
            // when the parent module is still the virtual /$bunfs file.
            if (!resolved) {

                const marker = "imported from ";
                const at = message.lastIndexOf(marker);

                if (-1 !== at) {

                    const importer = message.slice(at + marker.length).split("\n")[0].trim();

                    if (importer) {
                        resolved = _packageEntry(request, { "filename": importer }, prefer);
                    }

                }

            }

            if (!resolved) {
                throw err;
            }

            return resolved;

        }

    };

// module

    // main.cts boots only when it is the main module. The executable is this file,
    // and it loads the sources copied beside it so the plugin shares that graph.
    const started = require(join(dirname(process.execPath), "lib", "src", "main.cts"));

    (started && started.default ? started.default : started)();
