/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
// - @typescript-eslint/no-require-imports is disabled because we need to import dynamically the MIA module
// - @typescript-eslint/no-var-requires is disabled for the same reason

// deps

    // natives
    import { readFile } from "node:fs/promises";
    import { join } from "node:path";

    // externals
    import { ConflictError, Mediator, NotFoundError, UnauthorizedError } from "node-pluginsmanager-plugin";

    import { assertAdmin, assertSelfOrAdmin } from "./utils/assertPermissions";
    import findPluginByName from "./utils/findPluginByName";
    import formatLogLine from "./utils/formatLogLine";
    import getCaller from "./utils/getCaller";
    import getFingerprint from "./utils/getFingerprint";
    import parseGithubPath from "./utils/parseGithubPath";
    import parseLogsLimit from "./utils/parseLogsLimit";
    import parseLogsRange from "./utils/parseLogsRange";
    import { serializeToken, serializeUser } from "./utils/serializeAuth";

// types & interfaces

    // externals
    import type { Request } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";
    import type PluginsManager from "node-pluginsmanager";
    import type { Orchestrator, iEventsMinimal, iUrlAllowedParameters } from "node-pluginsmanager-plugin"; // locals — types from the host mia project (imported via build/importTypes.js)

    // locals
    import type { sign as tSign } from "./types/tools/AuthJWT";
    import type tExtractToken from "./types/tools/extractToken";
    import type tLog from "./types/tools/models/Log";
    import type tToken from "./types/tools/models/Token";
    import type { AuthTokenPublic, FullAuthPublic } from "./types/tools/models/Token";
    import type tUser from "./types/tools/models/User";
    import type { UserAttributes } from "./types/tools/models/User";

    import type { operations, components } from "./Descriptor";
    import type { iGithubRepository } from "./utils/parseGithubPath";
    import type { iLogsRange } from "./utils/parseLogsRange";

// runtime bindings (host mia project, compiled CJS)

    const { sign } = require("../../../../lib/cjs/tools/AuthJWT") as { "sign": typeof tSign };
    const extractToken = (require("../../../../lib/cjs/tools/extractToken") as { "default": typeof tExtractToken }).default;
    const Log = (require("../../../../lib/cjs/tools/models/Log") as { "default": typeof tLog }).default;
    const Token = (require("../../../../lib/cjs/tools/models/Token") as { "default": typeof tToken }).default;
    const User = (require("../../../../lib/cjs/tools/models/User") as { "default": typeof tUser }).default;

// private

    // Authentication is enforced by the host middleware; this only resolves the
    // caller identity from its Bearer token, for self / admin checks.
    function _getCaller (url: iUrlAllowedParameters): Promise<FullAuthPublic> {

        return getCaller((token: string): Promise<FullAuthPublic | undefined> => {
            return Token.getUserByToken(token);
        }, url);

    }

    function _assertNotLastAdmin (message: string): Promise<void> {

        return User.count({
            "where": {
                "isAdmin": true
            }
        }).then((adminCount: number): void => {

            if (1 >= adminCount) {
                throw new ConflictError(message);
            }

        });

    }

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
    "user.added": [ components["schemas"]["User"] ];
    "user.removed": [ components["schemas"]["User"] ];
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

    public getUsers (): Promise<operations["getUsers"]["responses"]["200"]["content"]["application/json"]> {

        return User.findAll().then((users: tUser[]): operations["getUsers"]["responses"]["200"]["content"]["application/json"] => {

            return users.map(serializeUser);

        });

    }

    // Create a user (admin only). Reject if the name already exists, persist via
    // the host User model, then emit user.added with the public snapshot.
    public createUser (url: iUrlAllowedParameters, body: operations["createUser"]["requestBody"]["content"]["application/json"]): Promise<operations["createUser"]["responses"]["201"]["content"]["application/json"]> {

        return _getCaller(url).then((caller: FullAuthPublic): Promise<tUser | null> => {

            assertAdmin(caller);

            return User.findOne({
                "where": {
                    "name": body.name
                }
            });

        }).then((existing: tUser | null): Promise<tUser> => {

            if (existing) {
                throw new ConflictError("User '" + body.name + "' already exists");
            }

            // password is hashed by the host User model hooks
            return User.create({
                "name": body.name,
                "password": body.password,
                "isAdmin": Boolean(body.isAdmin)
            });

        }).then((user: tUser): operations["createUser"]["responses"]["201"]["content"]["application/json"] => {

            const serialized: components["schemas"]["User"] = serializeUser(user);

            this.emit("user.added", serialized);

            return serialized;

        });

    }

    public getUser (url: iUrlAllowedParameters): Promise<operations["getUser"]["responses"]["200"]["content"]["application/json"]> {

        const urlParamsPath: operations["getUser"]["parameters"]["path"] = url.path as operations["getUser"]["parameters"]["path"];
        const name: string = urlParamsPath.name;

        return User.findOne({
            "where": {
                "name": name
            }
        }).then((user: tUser | null): operations["getUser"]["responses"]["200"]["content"]["application/json"] => {

            if (!user) {
                throw new NotFoundError("User '" + name + "' not found");
            }

            return serializeUser(user);

        });

    }

    // Update a user (self or admin). isAdmin change is admin-only; last-admin
    // demote is rejected. Persist password and/or isAdmin, then return the public user.
    public updateUser (url: iUrlAllowedParameters, body: operations["updateUser"]["requestBody"]["content"]["application/json"]): Promise<operations["updateUser"]["responses"]["200"]["content"]["application/json"]> {

        const urlParamsPath: operations["updateUser"]["parameters"]["path"] = url.path as operations["updateUser"]["parameters"]["path"];
        const name: string = urlParamsPath.name;

        return _getCaller(url).then((caller: FullAuthPublic): Promise<tUser> => {

            assertSelfOrAdmin(caller, name);

            if ("boolean" === typeof body.isAdmin && !caller.isAdmin) {
                throw new UnauthorizedError("Admin privileges required to change isAdmin");
            }

            return User.findOne({
                "where": {
                    "name": name
                }
            }).then((existing: tUser | null): Promise<tUser> => {

                if (!existing) {
                    throw new NotFoundError("User '" + name + "' not found");
                }

                let lastAdminGuard: Promise<void> = Promise.resolve();

                if (false === body.isAdmin && existing.isAdmin) {
                    lastAdminGuard = _assertNotLastAdmin("Cannot remove the last admin");
                }

                return lastAdminGuard.then((): Promise<tUser> => {

                    const attributes: Partial<UserAttributes> = {};

                    if ("string" === typeof body.password) {
                        attributes.password = body.password; // hashed by the host User model hooks
                    }

                    if ("boolean" === typeof body.isAdmin) {
                        attributes.isAdmin = body.isAdmin;
                    }

                    if (!Object.keys(attributes).length) {
                        return Promise.resolve(existing);
                    }

                    return existing.update(attributes);

                });

            });

        }).then((user: tUser): operations["updateUser"]["responses"]["200"]["content"]["application/json"] => {

            return serializeUser(user);

        });

    }

    // Delete a user (self or admin). Snapshot the public user first; reject
    // last-admin; emit user.removed after a successful remove.
    public deleteUser (url: iUrlAllowedParameters): Promise<void> {

        const urlParamsPath: operations["deleteUser"]["parameters"]["path"] = url.path as operations["deleteUser"]["parameters"]["path"];
        const name: string = urlParamsPath.name;

        return _getCaller(url).then((caller: FullAuthPublic): Promise<void> => {

            assertSelfOrAdmin(caller, name);

            return User.findOne({
                "where": {
                    "name": name
                }
            }).then((existing: tUser | null): Promise<void> => {

                if (!existing) {
                    throw new NotFoundError("User '" + name + "' not found");
                }

                const snapshot: components["schemas"]["User"] = serializeUser(existing);

                let lastAdminGuard: Promise<void> = Promise.resolve();

                if (existing.isAdmin) {
                    lastAdminGuard = _assertNotLastAdmin("Cannot delete the last admin");
                }

                // tokens are destroyed by the host User model hooks
                return lastAdminGuard.then((): Promise<void> => {

                    return existing.destroy();

                }).then((): void => {

                    this.emit("user.removed", snapshot);

                });

            });

        });

    }

    public getUserTokens (url: iUrlAllowedParameters): Promise<operations["getUserTokens"]["responses"]["200"]["content"]["application/json"]> {

        const urlParamsPath: operations["getUserTokens"]["parameters"]["path"] = url.path as operations["getUserTokens"]["parameters"]["path"];
        const name: string = urlParamsPath.name;

        return _getCaller(url).then((caller: FullAuthPublic): Promise<AuthTokenPublic[]> => {

            assertSelfOrAdmin(caller, name);

            return User.findOne({
                "where": {
                    "name": name
                }
            }).then((existing: tUser | null): Promise<AuthTokenPublic[]> => {

                if (!existing) {
                    throw new NotFoundError("User '" + name + "' not found");
                }

                return Token.getByUserName(name);

            });

        }).then((tokens: AuthTokenPublic[]): operations["getUserTokens"]["responses"]["200"]["content"]["application/json"] => {

            return tokens.map(serializeToken);

        });

    }

    public deleteToken (url: iUrlAllowedParameters, body: operations["deleteToken"]["requestBody"]["content"]["application/json"]): Promise<void> {

        const token: string = body.token;

        return _getCaller(url).then((caller: FullAuthPublic): Promise<void> => {

            return Token.getUserByToken(token).then((owner: FullAuthPublic | undefined): Promise<void> => {

                if (!owner) {
                    throw new NotFoundError("Token not found");
                }

                if (!caller.isAdmin && caller.name !== owner.name) {
                    throw new UnauthorizedError("Forbidden");
                }

                return Token.destroy({
                    "where": {
                        "token": token
                    }
                }).then((): void => {
                    // token revoked
                });

            });

        });

    }

    public getLogs (url: iUrlAllowedParameters): Promise<operations["getLogs"]["responses"]["200"]["content"]["text/plain"]> {

        const urlParamsQuery: operations["getLogs"]["parameters"]["query"] = (url.query ?? {}) as operations["getLogs"]["parameters"]["query"];

        return Promise.resolve().then((): Promise<tLog[]> => {

            const range: iLogsRange = parseLogsRange(url.query);
            const limit: number = parseLogsLimit(url.query);

            return Log.countInRange(range.from, range.to, urlParamsQuery.level).then((count: number): Promise<tLog[]> => {

                if (count > limit) {
                    throw new RangeError(count + " matching records exceed the effective limit of " + limit + ". Narrow the range or raise \"limit\".");
                }

                return Log.findInRange(range.from, range.to, urlParamsQuery.level, limit);

            });

        }).then((logs: tLog[]): operations["getLogs"]["responses"]["200"]["content"]["text/plain"] => {

            return logs.map(formatLogLine).join("\n");

        });

    }

    public deleteLogs (url: iUrlAllowedParameters): Promise<void> {

        return _getCaller(url).then((caller: FullAuthPublic): Promise<number> => {

            assertAdmin(caller);

            const range: iLogsRange = parseLogsRange(url.query);

            return Log.destroyInRange(range.from, range.to);

        }).then((): void => {
            // logs purged
        });

    }

}
