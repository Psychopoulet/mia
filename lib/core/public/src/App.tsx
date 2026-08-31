// deps

    // externals
    import React from "react";
    import { Alert, Modal, ModalBody } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "./SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "./SDK";
    import type { components, operations } from "./Descriptor";

    interface iState {
        "status": "CONNECTED" | "DISCONNECTED" | operations["getPluginStatus"]["responses"]["200"]["content"]["application/json"];
        "error": components["schemas"]["PushEventPluginError"]["data"] | null;
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
            "error": null
        };

    }

    public componentDidMount (): void {

        if (!this._sdk.isLoggedIn()) {
            window.location.assign("/");
            return;
        }

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
        else {

            return <div className="container-fluid">

                { this.state.error && <Modal appId="{{plugin.name}}-app" title="Error" variant="danger" centered size="sm" onClose={ this._handleCloseError }>
                    <ModalBody>
                        { this.state.error.message || "An error occurred" }
                    </ModalBody>
                </Modal> }

                <span>Hello World !</span>

            </div>;

        }

    }

}
