// deps

    // externals
    import React from "react";
    import {
        Button, Image
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../src/SDK";
    import ModalAddPluginFromGithub from "./ModalAddPluginFromGithub";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../src/SDK";
    import type { components, operations } from "../src/Descriptor";

    interface iState {
        "status": "DISCONNECTED" | "CONNECTED" | "LOGGED";
        "loading": boolean;
        "plugins": components["schemas"]["Plugin"][];
        "error": components["schemas"]["Error"] | null;
        "addPluginModalOpened": boolean;
        "installingPlugin": boolean;
    }

// component

export default class Menu extends React.Component<iPropsNode, iState> {

    // name

        public static displayName: string = "Menu";

    // private

        private readonly _sdk: SDK = getSDK();

    // constructor

    public constructor (props: iPropsNode) {

        super(props);

        // state

        this.state = {
            "status": "DISCONNECTED",
            "loading": false,
            "plugins": [],
            "error": null,
            "addPluginModalOpened": false,
            "installingPlugin": false
        };

    }

    public componentDidMount (): void {

        this.setState({
            "status": this._sdk.isLoggedIn() ? "LOGGED" : "CONNECTED",
            "plugins": [],
            "error": null
        });

        this._sdk
            .on("connected", this._onConnected)
            .on("disconnected", this._onDisconnected)
            .on("error", this._onError)
            .on("plugin-install-running", this._onPluginInstallRunning)
            .on("plugin-install-step", this._onPluginInstallRunning)
            .on("plugin-install-success", this._onPluginInstallSuccess)
            .on("plugin-install-fail", this._onPluginInstallFail)
            .on("plugin-uninstall-success", this._onPluginUninstallSuccess);

        this._sdk.connect();

    }

    public componentWillUnmount (): void {

        this._sdk
            .off("connected", this._onConnected)
            .off("disconnected", this._onDisconnected)
            .off("error", this._onError)
            .off("plugin-install-running", this._onPluginInstallRunning)
            .off("plugin-install-step", this._onPluginInstallRunning)
            .off("plugin-install-success", this._onPluginInstallSuccess)
            .off("plugin-install-fail", this._onPluginInstallFail)
            .off("plugin-uninstall-success", this._onPluginUninstallSuccess);

        this._sdk.disconnect();

        this.setState({
            "plugins": [],
            "error": null
        });

    }

    // private

    private _loadPlugins = (): void => {

        this.setState({
            "loading": true,
            "plugins": [],
            "error": null
        });

        this._sdk.getPlugins().then((plugins: operations["getPlugins"]["responses"]["200"]["content"]["application/json"]): void => {

            this.setState({
                "loading": false,
                "plugins": plugins
            });

        }).catch((err: Error): void => {

            this.setState({
                "loading": false,
                "error": {
                    "code": "unknown",
                    "message": err.message
                }
            });

        });

    };

    // sdk events

    private readonly _onConnected = (): void => {

        const isLoggedIn: boolean = this._sdk.isLoggedIn();

        this.setState({
            "status": isLoggedIn ? "LOGGED" : "CONNECTED"
        });

        if (isLoggedIn) {
            this._loadPlugins();
        }

    };

    private readonly _onDisconnected = (): void => {

        this.setState({
            "status": "DISCONNECTED",
            "plugins": [],
            "error": null
        });

    };

    private readonly _onError = (data: components["schemas"]["Error"]): void => {

        this.setState({
            "error": data
        });

    };

    private readonly _onPluginInstallRunning = (): void => {

        this.setState({
            "installingPlugin": true
        });

    };

    private readonly _onPluginInstallSuccess = (): void => {

        this.setState({
            "installingPlugin": false
        });

        return this._loadPlugins();

    };

    private readonly _onPluginInstallFail = (): void => {

        this.setState({
            "installingPlugin": false
        });

    };

    private readonly _onPluginUninstallSuccess = (): void => {

        return this._loadPlugins();

    };

    // interface handlers

    private readonly _handleAddPluginFromGitHub = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "addPluginModalOpened": true
        });

    };

    private readonly _handleCloseAddPluginFromGitHub = (e?: React.MouseEvent<HTMLButtonElement>): void => {

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.setState({
            "addPluginModalOpened": false
        });

    };

    // render

    private readonly _renderContent = (): React.JSX.Element[] | React.JSX.Element => {

        if (0 >= this.state.plugins.length) {

            return <li className="nav-item">
                <span className="nav-link disabled text-warning">No plugins found</span>
            </li>;

        }

        return this.state.plugins.map((plugin: components["schemas"]["Plugin"]): React.JSX.Element => {

            return <li key={ plugin.name } className="nav-item">
                <a className="nav-link" href={ "/" + plugin.name + "/public/index.html" }>{ plugin.name }</a>
            </li>;

        });

    }

    public render (): React.JSX.Element | undefined {

        if ("LOGGED" !== this.state.status) {
            return;
        }

        return <nav className="navbar navbar-expand-md">

            <div className="container-fluid">

                { this.state.addPluginModalOpened && <ModalAddPluginFromGithub
                    onClose={ this._handleCloseAddPluginFromGitHub }
                /> }

                <a className="navbar-brand" href="/">
                    <Image src="/public/pictures/favicon.png" alt="Home" width={ 32 } height={ 32 } /> Home
                </a>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-collapser" aria-controls="navbar-collapser" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div id="navbar-collapser" className="collapse navbar-collapse">

                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                        { this.state.error ? <li className="nav-item">
                            <span className="nav-link disabled text-danger">{ this.state.error.message }</span>
                        </li> : this._renderContent() }

                    </ul>

                    <Button title="Add plugin from GitHub"
                        icon="plus" variant="success" outline
                        disabled={ this.state.addPluginModalOpened || this.state.installingPlugin }
                        onClick={ this._handleAddPluginFromGitHub }
                    >
                        Add plugin from GitHub
                    </Button>

                </div>

            </div>

        </nav>;

    }

}
