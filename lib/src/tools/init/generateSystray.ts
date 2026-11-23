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
    import type { ClickEvent, Conf, MenuItem } from "systray2";

    // locals
    import type { iLogger } from "./generateLogger";

    interface iTrayItem extends MenuItem {
        "click"?: () => void;
    }

    interface iTrayHandle {
        "onClick": (listener: (action: ClickEvent) => void) => Promise<unknown>;
        "ready": () => Promise<void>;
        "kill": (exitNode?: boolean) => Promise<void>;
    }

    type tLaunch = (command: string, args: string[]) => { "unref": () => void };

    export interface iTrayDeps {
        "create": (conf: Conf) => iTrayHandle;
        "open": (url: string) => void;
        "prepare": () => Promise<void>;
        "env"?: NodeJS.ProcessEnv;
        "platform"?: string;
        "arch"?: string;
    }

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

    function _deps (): iTrayDeps {

        return {
            "create": (conf: Conf): SysTray => {
                return new SysTray(conf);
            },
            "open": openLocalUrl,
            "prepare": prepareInstalledTray
        };

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

    function _listen (tray: iTrayHandle): void {

        tray.onClick((action: ClickEvent): void => {

            const item = action.item as iTrayItem;

            if ("function" === typeof item.click) {
                item.click();
            }

        }).catch((): void => {
            return undefined;
        });

    }

// module

export function launchDetached (command: string, args: string[]): { "unref": () => void } {

    return spawn(command, args, {
        "detached": true,
        "stdio": "ignore",
        "windowsHide": true
    });

}

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

export function openLocalUrl (url: string, launch: tLaunch = launchDetached, platform: string = process.platform): void {

    const opened = _command(url, platform);

    launch(opened.command, opened.args).unref();

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

export default function generateSystray (container: ContainerPattern, onQuit: () => void, deps: iTrayDeps = _deps()): Promise<void> {

    const env = deps.env ?? process.env;
    const platform = deps.platform ?? process.platform;
    const arch = deps.arch ?? process.arch;
    const enabled = container.get<ConfManager>("conf").get<boolean>("tray-enable");
    const log: iLogger = container.get<iLogger>("log");

    if (!enabled) {

        log.debug("tray skipped: disabled");
        return Promise.resolve();

    }

    const reason = traySkipReason(env, platform, arch);

    if ("" !== reason) {

        log.debug("tray skipped: " + reason);
        return Promise.resolve();

    }

    return _openTray(container, onQuit, deps, platform);

}

function _openTray (container: ContainerPattern, onQuit: () => void, deps: iTrayDeps, platform: string): Promise<void> {

    const port = container.get<ConfManager>("conf").get<number>("port");
    const url = "http://127.0.0.1:" + String(port) + "/";
    const name = container.get<string>("app.name");
    const log: iLogger = container.get<iLogger>("log");
    const started: { "tray": iTrayHandle | null } = { "tray": null };
    const openItem: iTrayItem = {
        "title": "Open",
        "tooltip": url,
        "checked": false,
        "enabled": true,
        "click": (): void => {
            deps.open(url);
        }
    };
    const quitItem: iTrayItem = {
        "title": "Quit",
        "tooltip": "Quit",
        "checked": false,
        "enabled": true,
        "click": (): void => {

            if (null !== started.tray) {
                started.tray.kill(false).then(onQuit).catch(onQuit);
            }

        }
    };

    return deps.prepare().then(() => {

        started.tray = deps.create({
            "menu": {
                "icon": join(installRoot(), "public", "pictures", trayIconFile(platform)),
                "isTemplateIcon": trayIsTemplateIcon(platform),
                "title": name,
                "tooltip": name,
                "items": [
                    openItem,
                    quitItem
                ]
            },
            "debug": false,
            "copyDir": true
        });

        _listen(started.tray);

        return started.tray.ready();

    }).catch((err: Error): void => {

        log.error(err.message);

    });

}
