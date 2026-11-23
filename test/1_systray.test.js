// deps

    // natives
    const { mkdir, mkdtemp, rm, stat, writeFile } = require("node:fs/promises");
    const { tmpdir } = require("node:os");
    const { join } = require("node:path");
    const { strictEqual } = require("node:assert");

    // externals
    const ContainerPattern = require("node-containerpattern");

    // locals
    const {
        launchDetached,
        openLocalUrl,
        prepareInstalledTray,
        preparePlatformTray,
        prepareTrayHelper,
        trayHelperName,
        trayIconFile,
        trayIsTemplateIcon,
        traySkipReason
    } = require("../lib/src/tools/init/generateSystray.ts");
    const generateSystray = require("../lib/src/tools/init/generateSystray.ts").default;

// private

    function _logger (lines) {

        function push (message) {
            lines.push(message);
        }

        return {
            "critical": push,
            "debug": push,
            "error": push,
            "info": push,
            "success": push,
            "warning": push
        };

    }

    function _container (lines, trayEnable) {

        const container = new ContainerPattern();

        container.set("log", _logger(lines));
        container.set("conf", {
            "get": (key) => {
                return "tray-enable" === key ? true === trayEnable : 18765;
            }
        });
        container.set("app.name", "mia");

        return container;

    }

// tests

describe("systray", () => {

    it("skips when the tray is disabled, headless, or arm64", () => {

        strictEqual(traySkipReason({}, "linux", "x64"), "headless");
        strictEqual(traySkipReason({ "DISPLAY": ":0" }, "linux", "x64"), "");
        strictEqual(traySkipReason({ "WAYLAND_DISPLAY": "wayland-0" }, "linux", "arm64"), "arm64");
        strictEqual(traySkipReason({}, "win32", "arm64"), "arm64");
        strictEqual(traySkipReason({}, "win32", "x64"), "");

    });

    it("picks an ico on windows and a template png on macOS", () => {

        strictEqual(trayIconFile("win32"), "favicon.ico");
        strictEqual(trayIconFile("linux"), "favicon.png");
        strictEqual(trayIconFile("darwin"), "favicon.png");
        strictEqual(trayIsTemplateIcon("darwin"), true);
        strictEqual(trayIsTemplateIcon("win32"), false);
        strictEqual(trayIsTemplateIcon("linux"), false);
        strictEqual(trayHelperName("win32"), "tray_windows_release.exe");
        strictEqual(trayHelperName("darwin"), "tray_darwin_release");
        strictEqual(trayHelperName("linux"), "tray_linux_release");

    });

    it("sets the helper and its cache copy to mode 0o755", async () => {

        const root = await mkdtemp(join(tmpdir(), "mia-tray-"));

        try {

            const source = join(root, "helper");
            const cache = join(root, "cache", "helper");

            await writeFile(source, "helper");
            await prepareTrayHelper(source, cache);

            if ("win32" !== process.platform) {

                strictEqual((await stat(source)).mode & 0o777, 0o755);
                strictEqual((await stat(cache)).mode & 0o777, 0o755);

            }

            const packaged = join(root, "node_modules", "systray2", "traybin");

            await mkdir(packaged, { "recursive": true });
            await writeFile(join(packaged, "tray_linux_release"), "linux");
            await writeFile(join(root, "node_modules", "systray2", "package.json"), "{\"version\":\"9.9.9\"}");
            await preparePlatformTray("linux", root, root);
            await preparePlatformTray("win32", root, root);
            await preparePlatformTray("linux", join(root, "missing"), root);

            const previousHome = process.env.HOME;
            const previousProfile = process.env.USERPROFILE;

            process.env.HOME = root;
            process.env.USERPROFILE = root;

            try {
                await prepareInstalledTray();
            }
            finally {
                process.env.HOME = previousHome;
                process.env.USERPROFILE = previousProfile;
            }

            const cached = join(root, ".cache", "node-systray", "9.9.9", "tray_linux_release");

            strictEqual((await stat(cached)).isFile(), true);

        }
        finally {

            await rm(root, { "recursive": true, "force": true });

        }

    });

    it("opens the local url and quits through the given shutdown", async () => {

        const lines = [];
        const opened = [];
        const order = [];
        let menu = null;

        await generateSystray(_container(lines, true), () => {
            order.push("quit");
        }, {
            "env": { "DISPLAY": ":0" },
            "platform": "linux",
            "arch": "x64",
            "prepare": () => Promise.resolve(),
            "open": (url) => {
                opened.push(url);
            },
            "create": (conf) => {

                menu = conf.menu;

                return {
                    "onClick": (listener) => {

                        listener({ "item": conf.menu.items[0] });
                        listener({ "item": conf.menu.items[1] });
                        listener({ "item": { "title": "plain" } });
                        return Promise.reject(new Error("click ignored"));

                    },
                    "ready": () => Promise.resolve(),
                    "kill": () => {

                        order.push("kill");
                        return Promise.resolve();

                    }
                };

            }
        });

        strictEqual(menu.icon.endsWith("favicon.png"), true);
        strictEqual(menu.isTemplateIcon, false);
        strictEqual(menu.items[0].title, "Open");
        strictEqual(opened[0], "http://127.0.0.1:18765/");
        strictEqual(order[0], "kill");
        strictEqual(order[1], "quit");
        strictEqual(menu.title, "mia");

        const launched = [];

        openLocalUrl("http://127.0.0.1:1/", (command, args) => {

            launched.push(command + " " + args.join(" "));
            return { "unref": () => undefined };

        }, "win32");
        openLocalUrl("http://127.0.0.1:1/", (command, args) => {

            launched.push(command + " " + args.join(" "));
            return { "unref": () => undefined };

        }, "darwin");
        openLocalUrl("http://127.0.0.1:1/", (command, args) => {

            launched.push(command + " " + args.join(" "));
            return { "unref": () => undefined };

        }, "linux");

        strictEqual(launched[0], "cmd /c start  http://127.0.0.1:1/");
        strictEqual(launched[1], "open http://127.0.0.1:1/");
        strictEqual(launched[2], "xdg-open http://127.0.0.1:1/");

        const child = launchDetached(process.execPath, [ "-e", "process.exit(0)" ]);

        child.unref();

    });

    it("logs a skip and a tray failure without spawning", async () => {

        const skipped = [];

        await generateSystray(_container(skipped, false), () => undefined, {
            "env": { "DISPLAY": ":0" },
            "platform": "linux",
            "arch": "x64",
            "prepare": () => Promise.reject(new Error("prepared")),
            "open": () => undefined,
            "create": () => {
                throw new Error("spawned");
            }
        });

        strictEqual(skipped[0], "tray skipped: disabled");

        const headless = [];

        await generateSystray(_container(headless, true), () => undefined, {
            "env": {},
            "platform": "linux",
            "arch": "x64",
            "prepare": () => Promise.reject(new Error("prepared")),
            "open": () => undefined,
            "create": () => {
                throw new Error("spawned");
            }
        });

        strictEqual(headless[0], "tray skipped: headless");

        const defaults = [];
        const previousHome = process.env.HOME;
        const previousProfile = process.env.USERPROFILE;
        const home = await mkdtemp(join(tmpdir(), "mia-tray-home-"));

        process.env.HOME = home;
        process.env.USERPROFILE = home;

        try {

            await generateSystray(_container(defaults, false), () => undefined);
            strictEqual(defaults[0], "tray skipped: disabled");

        }
        finally {

            process.env.HOME = previousHome;
            process.env.USERPROFILE = previousProfile;
            await rm(home, { "recursive": true, "force": true });

        }

        const failed = [];

        await generateSystray(_container(failed, true), () => undefined, {
            "env": {},
            "platform": "win32",
            "arch": "x64",
            "prepare": () => Promise.resolve(),
            "open": () => undefined,
            "create": () => {
                throw new Error("tray failed");
            }
        });

        strictEqual(failed[0], "tray failed");

    });

});
