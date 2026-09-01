// deps

    // natives
    import { readFile } from "node:fs/promises";
    import { join } from "node:path";

    // externals
    import { Mediator, NotFoundError } from "node-pluginsmanager-plugin";

    // locals
    import { sign } from "../../../cjs/tools/AuthJWT";
    import extractToken from "../../../cjs/tools/extractToken";
    import Token from "../../../cjs/tools/models/Token";
    import User from "../../../cjs/tools/models/User";
    import findPluginByName from "./utils/findPluginByName";
    import getFingerprint from "./utils/getFingerprint";
    import parseGithubPath from "./utils/parseGithubPath";

// types & interfaces

    // externals
    import type { Request } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";
    import type PluginsManager from "node-pluginsmanager";
    import type { Orchestrator, iEventsMinimal, iUrlAllowedParameters } from "node-pluginsmanager-plugin";

    // locals

    import type { UserAttributes } from "../../../cjs/tools/models/User";

    import type { operations, components } from "./Descriptor";
    import type { iGithubRepository } from "./utils/parseGithubPath";

// module

export default class MediatorCore extends Mediator<iEventsMinimal & {
    "initialized": [ ContainerPattern ];
    "released": [ ContainerPattern ];
    "error": [ components["schemas"]["PushEventPluginError"]["data"] ];
    "plugin-install-running": [ components["schemas"]["PushEventPluginInstallRunning"]["data"] ];
    "plugin-install-step": [ components["schemas"]["PushEventPluginInstallStep"]["data"] ];
    "plugin-install-success": [ components["schemas"]["PushEventPluginInstallSuccess"]["data"] ];
    "plugin-install-fail": [ components["schemas"]["PushEventPluginInstallFail"]["data"] ];
    "plugin-update-running": [ components["schemas"]["PushEventPluginUpdateRunning"]["data"] ];
    "plugin-update-step": [ components["schemas"]["PushEventPluginUpdateStep"]["data"] ];
    "plugin-update-fail": [ components["schemas"]["PushEventPluginUpdateFail"]["data"] ];
    "plugin-uninstall-running": [ components["schemas"]["PushEventPluginUninstallRunning"]["data"] ];
    "plugin-uninstall-success": [ components["schemas"]["PushEventPluginUninstallSuccess"]["data"] ];
    "plugin-uninstall-fail": [ components["schemas"]["PushEventPluginUninstallFail"]["data"] ];
}> {

    protected _container: ContainerPattern | null = null;
    protected _pluginsManager: PluginsManager | null = null;

    // constructor

    // Host mia already registers User/Token, syncs, and seeds admin.
    // Forward plugins-manager install/update progress as Mediator events.
    protected _initWorkSpace (container: ContainerPattern): Promise<void> {

        this._container = container;
        this._pluginsManager = container.get<PluginsManager>("plugins-manager");

        this._pluginsManager
            .on("installing", this._onInstalling)
            .on("updating", this._onUpdating);

        return Promise.resolve();

    }

    protected _releaseWorkSpace (): Promise<void> {

        if (this._pluginsManager) {

            this._pluginsManager
                .off("installing", this._onInstalling)
                .off("updating", this._onUpdating);

        }

        this._pluginsManager = null;
        this._container = null;

        return Promise.resolve();

    }

    private _getContainer (): ContainerPattern {

        if (!this._container) {
            throw new Error("Mediator is not initialized");
        }

        return this._container;

    }

    private readonly _onInstalling = (...payload: [ string, number, number, string ]): void => {

        const [
            pluginName,
            currentStep,
            maxSteps,
            stepMessage
        ] = payload;

        const data: components["schemas"]["PushEventPluginInstallStep"]["data"] = {
            "pluginName": pluginName as components["schemas"]["PushEventPluginInstallStep"]["data"]["pluginName"],
            currentStep,
            maxSteps,
            stepMessage
        };

        this.emit("plugin-install-step", data);

    };

    private readonly _onUpdating = (...payload: [ string, number, number, string ]): void => {

        const [
            pluginName,
            currentStep,
            maxSteps,
            stepMessage
        ] = payload;

        const data: components["schemas"]["PushEventPluginUpdateStep"]["data"] = {
            "pluginName": pluginName as components["schemas"]["PushEventPluginUpdateStep"]["data"]["pluginName"],
            currentStep,
            maxSteps,
            stepMessage
        };

        this.emit("plugin-update-step", data);

    };

    // private

    private _readPublic (relativePath: string): Promise<string> {

        return readFile(join(__dirname, "..", "..", "public", relativePath), "utf-8");

    }

    // front files

    public getFrontIndex (): Promise<operations["getFrontIndex"]["responses"]["200"]["content"]["text/html"]> {

        return this._readPublic("index.html").then((content: string): string => {

            return content

                .replace(/{{plugin.name}}/g, this.getPluginName())
                .replace(/{{plugin.version}}/g, this.getPluginVersion())
                .replace(/{{plugin.description}}/g, this.getPluginDescription());

        });

    }

    public getFrontMenu (): Promise<operations["getFrontMenu"]["responses"]["200"]["content"]["text/javascript"]> {

        return this._readPublic(join("dist", "menu.min.js")).then((content: string): string => {

            return content

                .replace(/{{plugin.name}}/g, this.getPluginName())
                .replace(/{{plugin.version}}/g, this.getPluginVersion())
                .replace(/{{plugin.description}}/g, this.getPluginDescription());

        });

    }

    public getFrontMenuMap (): Promise<string> { // tricks return to avoid costful parsing
        return this._readPublic(join("dist", "menu.min.js.map"));
    }

    public getFrontApp (): Promise<operations["getFrontApp"]["responses"]["200"]["content"]["text/javascript"]> {

        return this._readPublic(join("dist", "bundle.min.js")).then((content: string): string => {

            return content

                .replace(/{{plugin.name}}/g, this.getPluginName())
                .replace(/{{plugin.version}}/g, this.getPluginVersion())
                .replace(/{{plugin.description}}/g, this.getPluginDescription());

        });

    }

    public getFrontAppMap (): Promise<string> { // tricks return to avoid costful parsing
        return this._readPublic(join("dist", "bundle.min.js.map"));
    }

    // api

    public login (url: iUrlAllowedParameters, body: operations["login"]["requestBody"]["content"]["application/json"]): Promise<operations["login"]["responses"]["201"]["content"]["application/json"]> {

        const container: ContainerPattern = this._getContainer();
        const fingerprint: string = getFingerprint(url.headers);

        return User.getByNameAndPassword(body.name, body.password).then((user: UserAttributes | undefined): Promise<string> => {

            if (!user) {
                throw new NotFoundError("Invalid credentials");
            }

            return sign(body.name, container.get<ConfManager>("conf").get("auth-access-token")).then((token: string): Promise<string> => {

                return Token.create({
                    "idUser": user.id,
                    "token": token,
                    "fingerprint": fingerprint
                }).then((): string => {
                    return token;
                });

            });

        });

    }

    public logout (url: iUrlAllowedParameters): Promise<void> {

        const token: string = extractToken({
            "headers": url.headers ?? {}
        } as Request);

        this._log("info", "logout");

        return Token.destroy({
            "where": {
                "token": token
            }
        }).then((): void => {
            // session closed
        });

    }

    public getPlugins (): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> {

        return Promise.resolve(this._getContainer().get<PluginsManager>("plugins-manager").plugins.map((plugin: Orchestrator): components["schemas"]["Plugin"] => {

            return {
                "name": plugin.name as components["schemas"]["Plugin"]["name"],
                "version": plugin.version,
                "description": plugin.description,
                "enabled": plugin.enabled,
                "dependencies": plugin.dependencies as Record<string, string>,
                "engines": plugin.engines as components["schemas"]["Plugin"]["engines"],
                "authors": plugin.authors,
                "license": plugin.license,
                "repository": plugin.repository
            };

        }));

    }

    // Parse GitHub path, emit install-running, install via plugins-manager, emit
    // success with the plugin name (201 empty). On error emit install-fail.
    public installPluginFromGithub (url: iUrlAllowedParameters, body: operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"]): Promise<void> {

        const container: ContainerPattern = this._getContainer();

        return Promise.resolve().then((): iGithubRepository => {

            return parseGithubPath(body.path);

        }).then(({ user, repo }: iGithubRepository): Promise<Orchestrator> => {

            const data: components["schemas"]["PushEventPluginInstallRunning"]["data"] = repo as components["schemas"]["PushEventPluginInstallRunning"]["data"];

            this.emit("plugin-install-running", data);

            return container.get<PluginsManager>("plugins-manager").installViaGithub(user, repo, container);

        }).then((plugin: Orchestrator): void => {

            const data: components["schemas"]["PushEventPluginInstallSuccess"]["data"] = plugin.name as components["schemas"]["PushEventPluginInstallSuccess"]["data"];

            this.emit("plugin-install-success", data);

        }).catch((err: Error): Promise<void> => {

            const data: components["schemas"]["PushEventPluginInstallFail"]["data"] = {
                "pluginName": body.path as components["schemas"]["PushEventPluginInstallFail"]["data"]["pluginName"],
                "error": err.message
            };

            this.emit("plugin-install-fail", data);

            return Promise.reject(err);

        });

    }

    // Find plugin by path name, emit update-running, update via GitHub (204).
    // On error emit update-fail with the plugin name and message.
    public updatePluginFromGithub (url: iUrlAllowedParameters): Promise<void> {

        const container: ContainerPattern = this._getContainer();
        const urlParamsPath: operations["updatePluginFromGithub"]["parameters"]["path"] = url.path as operations["updatePluginFromGithub"]["parameters"]["path"];

        return Promise.resolve().then((): Promise<void> => {

            const pluginsManager: PluginsManager = container.get<PluginsManager>("plugins-manager");
            const plugin: Orchestrator | undefined = findPluginByName(pluginsManager, urlParamsPath.name);

            if (!plugin) {
                throw new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found");
            }

            const data: components["schemas"]["PushEventPluginUpdateRunning"]["data"] = urlParamsPath.name;

            this.emit("plugin-update-running", data);

            return pluginsManager.updateViaGithub(plugin, container).then((): void => {
                // plugin updated
            });

        }).catch((err: Error): Promise<void> => {

            const data: components["schemas"]["PushEventPluginUpdateFail"]["data"] = {
                "pluginName": urlParamsPath.name,
                "error": err.message
            };

            this.emit("plugin-update-fail", data);

            return Promise.reject(err);

        });

    }

    // Find plugin, emit uninstall-running, uninstall, emit success with the
    // returned name (204). On error emit uninstall-fail.
    public deletePlugin (url: iUrlAllowedParameters): Promise<void> {

        const container: ContainerPattern = this._getContainer();
        const urlParamsPath: operations["deletePlugin"]["parameters"]["path"] = url.path as operations["deletePlugin"]["parameters"]["path"];

        return Promise.resolve().then((): Promise<string> => {

            const pluginsManager: PluginsManager = container.get<PluginsManager>("plugins-manager");
            const plugin: Orchestrator | undefined = findPluginByName(pluginsManager, urlParamsPath.name);

            if (!plugin) {
                throw new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found");
            }

            const data: components["schemas"]["PushEventPluginUninstallRunning"]["data"] = plugin.name as components["schemas"]["PushEventPluginUninstallRunning"]["data"];

            this.emit("plugin-uninstall-running", data);

            return pluginsManager.uninstall(plugin, container);

        }).then((pluginName: string): void => {

            const data: components["schemas"]["PushEventPluginUninstallSuccess"]["data"] = pluginName as components["schemas"]["PushEventPluginUninstallSuccess"]["data"];

            this.emit("plugin-uninstall-success", data);

        }).catch((err: Error): Promise<void> => {

            const data: components["schemas"]["PushEventPluginUninstallFail"]["data"] = {
                "pluginName": urlParamsPath.name,
                "error": err.message
            };

            this.emit("plugin-uninstall-fail", data);

            return Promise.reject(err);

        });

    }

    public getPluginLatestTag (url: iUrlAllowedParameters): Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]> {

        const urlParamsPath: operations["getPluginLatestTag"]["parameters"]["path"] = url.path as operations["getPluginLatestTag"]["parameters"]["path"];
        const pluginsManager: PluginsManager = this._getContainer().get<PluginsManager>("plugins-manager");
        const plugin: Orchestrator | undefined = findPluginByName(pluginsManager, urlParamsPath.name);

        if (!plugin) {
            return Promise.reject(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found"));
        }

        return pluginsManager.getLatestGithubTag(plugin);

    }

}
