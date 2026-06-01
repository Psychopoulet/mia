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
        "status": "DISCONNECTED" | "CONNECTED" | "LOADING" | "LOADED";
        "plugins": components["schemas"]["Plugin"][];
        "error": components["schemas"]["Error"] | null;
        "addPluginModalOpened": boolean;
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
            "plugins": [],
            "error": null,
            "addPluginModalOpened": false
        };

    }

    public componentDidMount (): void {

        this.setState({
            "status": "LOADING",
            "plugins": [],
            "error": null
        });

        this._sdk
            .on("connected", this._onConnected)
            .on("disconnected", this._onDisconnected)
            .on("error", this._onError);

        this._sdk.connect();

    }

    public componentWillUnmount (): void {

        this._sdk.disconnect();

        this._sdk
            .off("connected", this._onConnected)
            .off("disconnected", this._onDisconnected)
            .off("error", this._onError);

        this.setState({
            "plugins": [],
            "error": null
        });

    }

    // sdk events

    private readonly _onConnected = (): void => {

        this.setState({
            "status": "LOADING",
            "plugins": [],
            "error": null
        });

        this._sdk.getPlugins().then((plugins: operations["getPlugins"]["responses"]["200"]["content"]["application/json"]): void => {

            this.setState({
                "status": "LOADED",
                "plugins": plugins
            });

        }).catch((err: Error): void => {

            this.setState({
                "status": "CONNECTED",
                "error": {
                    "code": "unknown",
                    "message": err.message
                }
            });

        });

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
            "status": "CONNECTED",
            "error": data
        });

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

        if ("LOADED" !== this.state.status) {

            return <li className="nav-item">
                <span className="nav-link disabled text-info">{ this.state.status }</span>
            </li>;

        }
        else if (0 >= this.state.plugins.length) {

            return <li className="nav-item">
                <span className="nav-link disabled text-warning">No plugins found</span>
            </li>;

        }

        return this.state.plugins.map((plugin: components["schemas"]["Plugin"]): React.JSX.Element => {

            return <li key={ plugin.name } className="nav-item">
                <a className="nav-link" href={ "/" + plugin.name + "/public/index.html" }>{ plugin.name }</a>
            </li>;

        });

    };

    public render (): React.JSX.Element | undefined {

        if ("DISCONNECTED" === this.state.status) {
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

                    <Button icon="plus"
                        variant="success" outline
                        disabled={ this.state.addPluginModalOpened }
                        onClick={ this._handleAddPluginFromGitHub }
                    >
                        Add plugin from GitHub
                    </Button>

                </div>

            </div>

        </nav>;

    }

}
