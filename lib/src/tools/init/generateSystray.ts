/*
    eslint-disable n/no-process-env
*/

// deps

    // natives
    import { spawn } from "node:child_process";
    import { chmod, cp, mkdir, readFile, stat } from "node:fs/promises";
    import { homedir } from "node:os";
    import { join } from "node:path";

    // externals
    import SysTray from "systray2";

    // locals
    import installRoot from "../installRoot";

// types & interfaces

    // externals
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Menu, MenuItem } from "systray2";

    // locals
    import type { iLogger } from "./generateLogger";

// private

    function _exists (file: string): Promise<boolean> {

        return stat(file).then(() => {
            return true;
        }).catch(() => {
            return false;
        });

    }

    function _firstExisting (paths: string[]): Promise<string> {

        return paths.reduce((chain, file) => {

            return chain.then((found) => {

                if ("" !== found) {
                    return found;
                }

                return _exists(file).then((ok) => {
                    return ok ? file : "";
                });

            });

        }, Promise.resolve(""));

    }

    function _trayVersion (root: string): Promise<string> {

        const manifest = join(root, "node_modules", "systray2", "package.json");

        return readFile(manifest, "utf8").then((content) => {

            const pkg = JSON.parse(content) as { "version": string };

            return pkg.version;

        });

    }

    function _command (url: string, platform: string): { "command": string, "args": string[] } {

        if ("win32" === platform) {

            return {
                "command": "cmd",
                "args": [
                    "/c",
                    "start",
                    "",
                    url
                ]
            };

        }

        if ("darwin" === platform) {

            return {
                "command": "open",
                "args": [ url ]
            };

        }

        return {
            "command": "xdg-open",
            "args": [ url ]
        };

    }

    function _launch (command: string, args: string[]): void {

        spawn(command, args, {
            "detached": true,
            "stdio": "ignore",
            "windowsHide": true
        }).unref();

    }

    function _onItem (item: MenuItem, tray: SysTray, onQuit: () => void): void {

        if ("Quit" === item.title) {

            tray.kill(false).then(onQuit).catch(onQuit);
            return;

        }

        const opened = _command(item.tooltip, process.platform);

        _launch(opened.command, opened.args);

    }

    function _publish (tray: SysTray, menu: Menu, log: iLogger): void {

        tray.sendAction({
            "type": "update-menu",
            "menu": menu
        }).catch((err: Error): void => {
            log.error(err.message);
        });

    }

    function _follow (manager: Pluginsmanager, tray: SysTray, names: string[], appName: string, port: number, log: iLogger): void {

        let current = names;

        manager.on("initialized", (plugin): void => {

            const next = includePlugin(current, plugin.name);

            if (next !== current) {

                current = next;
                _publish(tray, trayMenu(appName, port, current, process.platform), log);

            }

        });

        manager.on("released", (plugin): void => {

            const next = excludePlugin(current, plugin.name);

            if (next.length !== current.length) {

                current = next;
                _publish(tray, trayMenu(appName, port, current, process.platform), log);

            }

        });

    }

    function _openTray (container: ContainerPattern, onQuit: () => void): Promise<void> {

        const port = container.get<ConfManager>("conf").get<number>("port");
        const appName = container.get<string>("app.name");
        const log: iLogger = container.get<iLogger>("log");
        const manager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const names = manager.plugins.map((plugin): string => {
            return plugin.name;
        });
        const tray = new SysTray({
            "menu": trayMenu(appName, port, names, process.platform),
            "debug": false,
            "copyDir": true
        });

        _follow(manager, tray, names, appName, port, log);

        tray.onClick((action): void => {
            _onItem(action.item, tray, onQuit);
        }).catch((err: Error): void => {
            log.error(err.message);
        });

        return tray.ready();

    }

// module

export function traySkipReason (env: NodeJS.ProcessEnv, platform: string, arch: string): string {

    const display = env.DISPLAY;
    const wayland = env.WAYLAND_DISPLAY;

    if ("linux" === platform && (undefined === display || "" === display) && (undefined === wayland || "" === wayland)) {
        return "headless";
    }

    if ("arm64" === arch) {
        return "arm64";
    }

    return "";

}

export function trayIconFile (platform: string): string {

    return "win32" === platform ? "favicon.ico" : "favicon.png";

}

export function trayIsTemplateIcon (platform: string): boolean {

    return "darwin" === platform;

}

export function trayHelperName (platform: string): string {

    if ("win32" === platform) {
        return "tray_windows_release.exe";
    }

    if ("darwin" === platform) {
        return "tray_darwin_release";
    }

    return "tray_linux_release";

}

export function pluginPageUrl (port: number, pluginName: string): string {

    return "http://127.0.0.1:" + String(port) + "/" + pluginName + "/public/index.html";

}

export function includePlugin (names: string[], pluginName: string): string[] {

    if (names.includes(pluginName)) {
        return names;
    }

    return names.concat(pluginName);

}

export function excludePlugin (names: string[], pluginName: string): string[] {

    return names.filter((listed): boolean => {
        return listed !== pluginName;
    });

}

export function trayMenu (appName: string, port: number, pluginNames: string[], platform: string): Menu {

    const home = "http://127.0.0.1:" + String(port) + "/";
    const plugins: MenuItem[] = pluginNames.map((pluginName): MenuItem => {

        return {
            "title": pluginName,
            "tooltip": pluginPageUrl(port, pluginName),
            "checked": false,
            "enabled": true
        };

    });

    return {
        "icon": join(installRoot(), "public", "pictures", trayIconFile(platform)),
        "isTemplateIcon": trayIsTemplateIcon(platform),
        "title": appName,
        "tooltip": appName,
        "items": [
            {
                "title": "Open",
                "tooltip": home,
                "checked": false,
                "enabled": true
            },
            SysTray.separator,
            ...plugins,
            SysTray.separator,
            {
                "title": "Quit",
                "tooltip": "Quit",
                "checked": false,
                "enabled": true
            }
        ]
    };

}

export function prepareTrayHelper (source: string, cache: string): Promise<void> {

    return chmod(source, 0o755).then(() => {
        return mkdir(join(cache, ".."), { "recursive": true });
    }).then(() => {
        return cp(source, cache);
    }).then(() => {
        return chmod(cache, 0o755);
    });

}

export function preparePlatformTray (platform: string, root: string, cacheRoot: string): Promise<void> {

    if ("win32" === platform) {
        return Promise.resolve();
    }

    const name = trayHelperName(platform);

    return _firstExisting([
        join(root, "traybin", name),
        join(root, "node_modules", "systray2", "traybin", name)
    ]).then((source) => {

        if ("" === source) {
            return undefined;
        }

        return _trayVersion(root).then((version) => {
            return prepareTrayHelper(source, join(cacheRoot, ".cache", "node-systray", version, name));
        });

    });

}

export function prepareInstalledTray (): Promise<void> {

    return preparePlatformTray(process.platform, installRoot(), homedir());

}

export default function generateSystray (container: ContainerPattern, onQuit: () => void): Promise<void> {

    const enabled = container.get<ConfManager>("conf").get<boolean>("tray-enable");
    const log: iLogger = container.get<iLogger>("log");

    if (!enabled) {

        log.debug("tray skipped: disabled");
        return Promise.resolve();

    }

    const reason = traySkipReason(process.env, process.platform, process.arch);

    if ("" !== reason) {

        log.debug("tray skipped: " + reason);
        return Promise.resolve();

    }

    return prepareInstalledTray().then((): Promise<void> => {
        return _openTray(container, onQuit);
    }).catch((err: Error): void => {
        log.error(err.message);
    });

}
