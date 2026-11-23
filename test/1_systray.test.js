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
        excludePlugin,
        includePlugin,
        pluginPageUrl,
        prepareInstalledTray,
        preparePlatformTray,
        prepareTrayHelper,
        trayHelperName,
        trayIconFile,
        trayIsTemplateIcon,
        trayMenu,
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

// tests

describe("systray", () => {

    it("skips when the tray is disabled, headless, or arm64", async () => {

        strictEqual(traySkipReason({}, "linux", "x64"), "headless");
        strictEqual(traySkipReason({ "DISPLAY": ":0" }, "linux", "x64"), "");
        strictEqual(traySkipReason({ "WAYLAND_DISPLAY": "wayland-0" }, "linux", "arm64"), "arm64");
        strictEqual(traySkipReason({}, "win32", "arm64"), "arm64");
        strictEqual(traySkipReason({}, "win32", "x64"), "");

        const lines = [];
        const container = new ContainerPattern();

        container.set("log", _logger(lines));
        container.set("conf", {
            "get": () => false
        });

        await generateSystray(container, () => undefined);

        strictEqual(lines[0], "tray skipped: disabled");

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

    it("lists initialized plugins between Open and Quit", () => {

        strictEqual(pluginPageUrl(18765, "mia-core"), "http://127.0.0.1:18765/mia-core/public/index.html");

        const once = includePlugin([], "mia-core");
        const twice = includePlugin(once, "mia-core");
        const added = includePlugin(twice, "mia-inputs");
        const removed = excludePlugin(added, "mia-core");

        strictEqual(twice, once);
        strictEqual(added.length, 2);
        strictEqual(removed.length, 1);
        strictEqual(removed[0], "mia-inputs");
        strictEqual(excludePlugin(removed, "missing").length, 1);

        const menu = trayMenu("mia", 18765, removed, "linux");

        strictEqual(menu.title, "mia");
        strictEqual(menu.icon.endsWith("favicon.png"), true);
        strictEqual(menu.isTemplateIcon, false);
        strictEqual(menu.items[0].title, "Open");
        strictEqual(menu.items[0].tooltip, "http://127.0.0.1:18765/");
        strictEqual(menu.items[1].title, "mia-inputs");
        strictEqual(menu.items[1].tooltip, "http://127.0.0.1:18765/mia-inputs/public/index.html");
        strictEqual(menu.items[2].title, "Quit");
        strictEqual(trayMenu("mia", 1, [], "win32").icon.endsWith("favicon.ico"), true);
        strictEqual(trayMenu("mia", 1, [], "darwin").isTemplateIcon, true);

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

});
