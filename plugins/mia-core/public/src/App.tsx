// deps

    // externals
    import React from "react";
    import { Alert, Modal, ModalBody, NavTabs } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "./SDK";
    import Login from "./components/Login";
    import Plugins from "./components/Plugins";
    import CurrentUserProvider from "./components/CurrentUserProvider";
    import UsersManagement from "./components/UsersManagement";
    import LogsManagement from "./components/LogsManagement";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "./SDK";
    import type { components, operations } from "./Descriptor";

    interface iState {
        "status": "DISCONNECTED" | "CONNECTED" | "LOGGED" | operations["getPluginStatus"]["responses"]["200"]["content"]["application/json"];
        "error": components["schemas"]["Error"] | null;
        "tabIndex": number;
    }

// component

export default class App extends React.Component<iPropsNode, iState> {

    // name

        public static displayName: string = "App";

    // private

        private readonly _sdk: SDK = getSDK();

    // constructor

    public constructor (props: iPropsNode) {

        super(props);

        // state

        this.state = {
            "status": "DISCONNECTED",
            "error": null,
            "tabIndex": 0
        };

    }

    public componentDidMount (): void {

        this._sdk
            .on("connected", this._onConnected)
            .on("disconnected", this._onDisconnected)
            .on("error", this._onError);

        this._sdk.connect();

    }

    public componentWillUnmount (): void {

        this._sdk
            .off("connected", this._onConnected)
            .off("disconnected", this._onDisconnected)
            .off("error", this._onError);

        this._sdk.disconnect();

    }

    // sdk events

    private readonly _onConnected = (): void => {

        this.setState({
            "status": "CONNECTED"
        });

        this._sdk.getPluginStatus().then((status): void => {

            if ("INITIALIZED" === status) {

                this.setState({
                    "status": this._sdk.isLoggedIn() ? "LOGGED" : "INITIALIZED"
                });

                return;

            }

            this.setState({
                "status": status
            });

        }).catch((err: Error): void => {

            this.setState({
                "error": {
                    "code": "UNKNOWN_ERROR",
                    "message": err.message
                }
            });

        });

    };

    private readonly _onDisconnected = (): void => {

        this.setState({
            "status": "DISCONNECTED"
        });

    };

    private readonly _onError = (data: components["schemas"]["PushEventPluginError"]["data"]): void => {

        this.setState({
            "error": data
        });

    };

    // interface handlers

    private readonly _handleCloseError = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "error": null
        });

    };

    private readonly _handleError = (err: Error): void => {

        this.setState({
            "error": {
                "code": "unknown",
                "message": err.message
            }
        });

    };

    private readonly _handleSelectTab = (e: React.MouseEvent<HTMLAnchorElement>, newIndex: number): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "tabIndex": newIndex
        });

    };

    // render

    public render (): React.JSX.Element {

        if ("DISCONNECTED" === this.state.status) {

            return <div className="container">
                <Alert variant="danger">Not connected yet...</Alert>
            </div>;

        }
        else if ("CONNECTED" === this.state.status) {

            return <div className="container">
                <Alert variant="info">Checking status...</Alert>
            </div>;

        }
        else if ("RELEASED" === this.state.status) {

            return <div className="container">
                <Alert variant="warning">Not enabled...</Alert>
            </div>;

        }
        else if ("ENABLED" === this.state.status) {

            return <div className="container">
                <Alert variant="info">Not initialized yet...</Alert>
            </div>;

        }
        else if (![ "INITIALIZED", "LOGGED" ].includes(this.state.status)) {

            return <div className="container">
                <Alert variant="warning">Unknown status: { this.state.status }</Alert>
            </div>;

        }
        else { // "INITIALIZED" | "LOGGED"

            return <div className="container-fluid">

                { this.state.error && <Modal appId="{{plugin.name}}-app" title="Error" variant="danger" centered size="sm" onClose={ this._handleCloseError }>
                    <ModalBody>
                        { this.state.error.message || "An error occurred" }
                    </ModalBody>
                </Modal> }

                { "INITIALIZED" === this.state.status && <Login /> }
                { "LOGGED" === this.state.status && <>

                    <NavTabs items={ [
                        "Plugins",
                        "Users",
                        "Logs"
                    ] }
                        selectedIndex={ this.state.tabIndex }
                        onSelect={ this._handleSelectTab }
                    />

                    { 0 === this.state.tabIndex && <Plugins onError={ this._handleError } /> }

                    { 1 === this.state.tabIndex && <CurrentUserProvider onError={ this._handleError }>
                        <UsersManagement onError={ this._handleError } />
                    </CurrentUserProvider> }

                    { 2 === this.state.tabIndex && <CurrentUserProvider onError={ this._handleError }>
                        <LogsManagement onError={ this._handleError } />
                    </CurrentUserProvider> }

                </> }

            </div>;

        }

    }

}
