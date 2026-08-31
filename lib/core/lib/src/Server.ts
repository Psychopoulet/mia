// deps

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
            .on("error", this._onPluginError);

        return Promise.resolve();

    }

    public _releaseWorkSpace (): Promise<void> {

        (this._Mediator as MediatorCore)

            .off("initialized", this._onPluginInitialized)
            .off("released", this._onPluginReleased)
            .off("error", this._onPluginError);

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

}
