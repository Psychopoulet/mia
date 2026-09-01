// deps

    // natives

    // externals
    import { Server } from "node-pluginsmanager-plugin";

// types & interfaces

    // locals
    import type MediatorCore from "./Mediator";
    import type { components } from "./Descriptor";

// module

export default class ServerCore extends Server {

    public _initWorkSpace (): Promise<void> {

        (this._Mediator as MediatorCore)

            .on("initialized", this._onPluginInitialized)
            .on("released", this._onPluginReleased)
            .on("error", this._onPluginError)
            .on("plugin-install-running", this._onPluginInstallRunning)
            .on("plugin-install-step", this._onPluginInstallStep)
            .on("plugin-install-success", this._onPluginInstallSuccess)
            .on("plugin-install-fail", this._onPluginInstallFail)
            .on("plugin-update-running", this._onPluginUpdateRunning)
            .on("plugin-update-step", this._onPluginUpdateStep)
            .on("plugin-update-fail", this._onPluginUpdateFail)
            .on("plugin-uninstall-running", this._onPluginUninstallRunning)
            .on("plugin-uninstall-success", this._onPluginUninstallSuccess)
            .on("plugin-uninstall-fail", this._onPluginUninstallFail);

        return Promise.resolve();

    }

    public _releaseWorkSpace (): Promise<void> {

        (this._Mediator as MediatorCore)

            .off("initialized", this._onPluginInitialized)
            .off("released", this._onPluginReleased)
            .off("error", this._onPluginError)
            .off("plugin-install-running", this._onPluginInstallRunning)
            .off("plugin-install-step", this._onPluginInstallStep)
            .off("plugin-install-success", this._onPluginInstallSuccess)
            .off("plugin-install-fail", this._onPluginInstallFail)
            .off("plugin-update-running", this._onPluginUpdateRunning)
            .off("plugin-update-step", this._onPluginUpdateStep)
            .off("plugin-update-fail", this._onPluginUpdateFail)
            .off("plugin-uninstall-running", this._onPluginUninstallRunning)
            .off("plugin-uninstall-success", this._onPluginUninstallSuccess)
            .off("plugin-uninstall-fail", this._onPluginUninstallFail);

        return Promise.resolve();

    }

    // <events>

    private readonly _onPluginInitialized = (): void => {

        this.push("initialized");

    };

    private readonly _onPluginReleased = (): void => {

        this.push("released");

    };

    private readonly _onPluginError = (data: components["schemas"]["PushEventPluginError"]["data"]): void => {

        this.push("error", data);

    };

    private readonly _onPluginInstallRunning = (data: components["schemas"]["PushEventPluginInstallRunning"]["data"]): void => {

        this.push("plugin-install-running", data);

    };

    private readonly _onPluginInstallStep = (data: components["schemas"]["PushEventPluginInstallStep"]["data"]): void => {

        this.push("plugin-install-step", data);

    };

    private readonly _onPluginInstallSuccess = (data: components["schemas"]["PushEventPluginInstallSuccess"]["data"]): void => {

        this.push("plugin-install-success", data);

    };

    private readonly _onPluginInstallFail = (data: components["schemas"]["PushEventPluginInstallFail"]["data"]): void => {

        this.push("plugin-install-fail", data);

    };

    private readonly _onPluginUpdateRunning = (data: components["schemas"]["PushEventPluginUpdateRunning"]["data"]): void => {

        this.push("plugin-update-running", data);

    };

    private readonly _onPluginUpdateStep = (data: components["schemas"]["PushEventPluginUpdateStep"]["data"]): void => {

        this.push("plugin-update-step", data);

    };

    private readonly _onPluginUpdateFail = (data: components["schemas"]["PushEventPluginUpdateFail"]["data"]): void => {

        this.push("plugin-update-fail", data);

    };

    private readonly _onPluginUninstallRunning = (data: components["schemas"]["PushEventPluginUninstallRunning"]["data"]): void => {

        this.push("plugin-uninstall-running", data);

    };

    private readonly _onPluginUninstallSuccess = (data: components["schemas"]["PushEventPluginUninstallSuccess"]["data"]): void => {

        this.push("plugin-uninstall-success", data);

    };

    private readonly _onPluginUninstallFail = (data: components["schemas"]["PushEventPluginUninstallFail"]["data"]): void => {

        this.push("plugin-uninstall-fail", data);

    };

}
