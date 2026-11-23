// deps

    // natives
    const { spawn } = require("node:child_process");
    const { cp, mkdtemp, mkdir, readdir, readFile, rm, stat, writeFile } = require("node:fs/promises");
    const { existsSync } = require("node:fs");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");

// consts

    const ROOT = join(__dirname, "..");
    const OUTPUT = join(ROOT, "binary");
    const STAGE = join(OUTPUT, "_stage");
    const SMOKE_PORT = "18765";

// private

    function _run (args, cwd) {

        return new Promise((resolve, reject) => {

            const child = spawn(process.execPath, args, {
                "cwd": cwd,
                "stdio": "inherit"
            });

            child.on("exit", (code) => {
                return 0 === code ? resolve() : reject(new Error("bun " + args.join(" ") + " exited " + code));
            });

        });

    }

    function _hostTarget () {

        const arch = "arm64" === process.arch ? "arm64" : "x64";

        if ("win32" === process.platform) {
            return "bun-windows-" + arch;
        }

        if ("darwin" === process.platform) {
            return "bun-darwin-" + arch;
        }

        const muslLib = "arm64" === arch ? "/lib/ld-musl-aarch64.so.1" : "/lib/ld-musl-x86_64.so.1";

        return "bun-linux-" + arch + (existsSync(muslLib) ? "-musl" : "");

    }

    function _installProduction () {

        return rm(STAGE, { "recursive": true, "force": true }).then(() => {
            return mkdir(join(STAGE, "plugins", "mia-core"), { "recursive": true });
        }).then(() => {
            return Promise.all([
                cp(join(ROOT, "package.json"), join(STAGE, "package.json")),
                cp(join(ROOT, "bun.lock"), join(STAGE, "bun.lock")),
                cp(join(ROOT, "plugins", "mia-core", "package.json"), join(STAGE, "plugins", "mia-core", "package.json")),
                cp(join(ROOT, "plugins", "mia-core", "bun.lock"), join(STAGE, "plugins", "mia-core", "bun.lock"))
            ]);
        }).then(() => {
            return _run([ "install", "--production" ], STAGE);
        }).then(() => {
            return _run([ "install", "--production" ], join(STAGE, "plugins", "mia-core"));
        });

    }

    function _compile (target) {

        const directory = join(OUTPUT, target);

        return rm(directory, { "recursive": true, "force": true }).then(() => {
            return mkdir(directory, { "recursive": true });
        }).then(() => {

            // Sequelize requires pg-hstore only for the HSTORE type, and that package is not installed.
            return _run([
                "build",
                "--compile",
                "--conditions=require",
                "--external=pg-hstore",
                "--target=" + target,
                "--outfile=" + join(directory, "mia"),
                join(ROOT, "build", "binaryEntry.cjs")
            ], ROOT);
        }).then(() => {
            return _copyAssets(directory);
        });

    }

    // mia-core and the host sources stay on disk: the plugin requires those host files
    // by a relative path, and a compiled require() only resolves packages through index.js.
    function _copyTray (directory) {

        // Published helpers are x64 only. arm64 skips the tray.
        if ("arm64" === process.arch) {
            return Promise.resolve();
        }

        const name = "win32" === process.platform
            ? "tray_windows_release.exe"
            : ("darwin" === process.platform ? "tray_darwin_release" : "tray_linux_release");
        const source = join(STAGE, "node_modules", "systray2", "traybin", name);

        if (!existsSync(source)) {
            return Promise.resolve();
        }

        return mkdir(join(directory, "traybin"), { "recursive": true }).then(() => {
            return cp(source, join(directory, "traybin", name));
        });

    }

    function _copyAssets (directory) {

        const plugin = join(directory, "plugins", "mia-core");

        return mkdir(plugin, { "recursive": true }).then(() => {
            return Promise.all([
                cp(join(ROOT, "package.json"), join(directory, "package.json")),
                cp(join(ROOT, "public", "pictures"), join(directory, "public", "pictures"), { "recursive": true }),
                cp(join(ROOT, "lib", "src"), join(directory, "lib", "src"), { "recursive": true }),
                cp(join(STAGE, "node_modules"), join(directory, "node_modules"), { "recursive": true, "dereference": true }),
                cp(join(ROOT, "plugins", "mia-core", "package.json"), join(plugin, "package.json")),
                cp(join(ROOT, "plugins", "mia-core", "lib", "src"), join(plugin, "lib", "src"), { "recursive": true }),
                cp(join(ROOT, "plugins", "mia-core", "lib", "data"), join(plugin, "lib", "data"), { "recursive": true }),
                cp(join(ROOT, "plugins", "mia-core", "public", "dist"), join(plugin, "public", "dist"), { "recursive": true }),
                cp(join(ROOT, "plugins", "mia-core", "public", "index.html"), join(plugin, "public", "index.html"))
            ]);
        }).then(() => {

            const pluginModules = join(STAGE, "plugins", "mia-core", "node_modules");

            if (!existsSync(pluginModules)) {
                return undefined;
            }

            return cp(pluginModules, join(plugin, "node_modules"), { "recursive": true, "dereference": true });

        }).then(() => {
            return _copyTray(directory);
        }).then(() => {

            // A compiled executable resolves a package through index.js and ignores "main".
            return _shimPackages(join(directory, "node_modules")).then(() => {
                return _shimPackage(plugin);
            }).then(() => {

                const pluginModules = join(plugin, "node_modules");

                if (!existsSync(pluginModules)) {
                    return undefined;
                }

                return _shimPackages(pluginModules);

            });

        });

    }

    function _exportEntry (value) {

        if ("string" === typeof value) {
            return value;
        }

        if (!value || "object" !== typeof value) {
            return "";
        }

        if (value["."]) {
            return _exportEntry(value["."]);
        }

        if ("string" === typeof value.require) {
            return value.require;
        }

        if (value.require && "string" === typeof value.require.default) {
            return value.require.default;
        }

        if ("string" === typeof value.default) {
            return value.default;
        }

        if ("string" === typeof value.node) {
            return value.node;
        }

        if ("string" === typeof value.bun) {
            return value.bun;
        }

        return "";

    }

    function _resolveEntry (directory, entry) {

        const relative = entry.startsWith(".") ? entry : "./" + entry;
        const absolute = join(directory, relative);

        if (existsSync(absolute + ".js")) {
            return relative + ".js";
        }

        if (existsSync(join(absolute, "index.js"))) {
            return relative.replace(/\/$/, "") + "/index.js";
        }

        if (!existsSync(absolute)) {
            return "";
        }

        return relative;

    }

    function _shimPackage (directory) {

        const manifest = join(directory, "package.json");

        if (!existsSync(manifest) || existsSync(join(directory, "index.js"))) {
            return Promise.resolve();
        }

        return readFile(manifest, "utf-8").then((content) => {

            const pkg = JSON.parse(content);
            const declared = "string" === typeof pkg.main && "" !== pkg.main ? pkg.main : _exportEntry(pkg.exports);
            const entry = declared ? _resolveEntry(directory, declared) : "";

            if (!entry || "./index.js" === entry || "index.js" === entry) {
                return undefined;
            }

            return writeFile(join(directory, "index.js"), "module.exports = require(" + JSON.stringify(entry) + ");\n");

        });

    }

    function _shimPackages (directory) {

        if (!existsSync(directory)) {
            return Promise.resolve();
        }

        return readdir(directory).then((names) => {

            return names.reduce((chain, name) => {

                if (name.startsWith(".")) {
                    return chain;
                }

                const child = join(directory, name);

                return chain.then(() => {
                    return stat(child);
                }).then((info) => {

                    if (!info.isDirectory()) {
                        return undefined;
                    }

                    if (name.startsWith("@")) {
                        return _shimPackages(child);
                    }

                    return _shimPackage(child).then(() => {
                        return _shimPackages(join(child, "node_modules"));
                    });

                });

            }, Promise.resolve());

        });

    }

    function _smoke (target) {

        const directory = join(OUTPUT, target);
        const executable = existsSync(join(directory, "mia.exe")) ? join(directory, "mia.exe") : join(directory, "mia");

        return mkdtemp(join(tmpdir(), "mia-binary-")).then((home) => {

            return new Promise((resolve, reject) => {

                const child = spawn(executable, [], {
                    "cwd": directory,
                    "env": {
                        ...process.env,
                        "HOME": home,
                        "USERPROFILE": home,
                        "port": SMOKE_PORT,
                        "tray-enable": "false"
                    },
                    "stdio": [ "ignore", "pipe", "pipe" ]
                });

                let output = "";
                let stopped = false;
                let settled = false;
                let checked = false;

                const timer = setTimeout(() => {
                    child.kill();
                    _finish(new Error("smoke timed out\n" + output));
                }, 30000);

                function _finish (err) {

                    if (settled) {
                        return;
                    }

                    settled = true;
                    clearTimeout(timer);
                    return err ? reject(err) : resolve();

                }

                function _stop () {

                    if (stopped) {
                        return;
                    }

                    stopped = true;
                    child.kill("SIGTERM");

                    setTimeout(() => {

                        if (null === child.exitCode) {
                            spawn("taskkill", [ "/F", "/T", "/PID", String(child.pid) ], { "stdio": "ignore" });
                        }

                    }, 5000);

                }

                function _onData (chunk) {

                    const text = String(chunk);
                    output += text;
                    process.stdout.write(text);

                    if (checked || !output.includes("started on port " + SMOKE_PORT)) {
                        return;
                    }

                    checked = true;

                    fetch("http://127.0.0.1:" + SMOKE_PORT + "/", { "redirect": "manual" }).then((response) => {

                        if (301 !== response.status) {
                            throw new Error("smoke expected 301, got " + response.status);
                        }

                        _stop();

                    }).catch((err) => {
                        _stop();
                        _finish(err);
                    });

                }

                child.stdout.on("data", _onData);
                child.stderr.on("data", _onData);
                child.on("exit", (code) => {
                    return stopped ? _finish() : _finish(new Error("smoke exited " + code + "\n" + output));
                });

            });

        });

    }

// module

    const target = _hostTarget();

    Promise.resolve().then(() => {

        if (!existsSync(join(ROOT, "plugins", "mia-core", "public", "dist", "bundle.min.js"))) {
            throw new Error("plugins/mia-core/public/dist is missing; run build-front first");
        }

        return rm(OUTPUT, { "recursive": true, "force": true });

    }).then(() => {
        return _installProduction();
    }).then(() => {
        console.log("compile " + target);
        return _compile(target);
    }).then(() => {
        console.log("smoke " + target);
        return _smoke(target);
    }).then(() => {
        return rm(STAGE, { "recursive": true, "force": true });
    }).catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
