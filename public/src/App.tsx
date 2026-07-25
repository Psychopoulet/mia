// deps

    // externals
    import React from "react";
    import { Alert, Modal, ModalBody } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "./SDK";
    import Plugins from "./components/Plugins";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "./SDK";
    import type { components } from "./Descriptor";

    interface iState {
        "status": "DISCONNECTED" | "CONNECTED" | "LOGGED";
        "error": components["schemas"]["Error"] | null;
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
            "status": this._sdk.isLoggedIn() ? "LOGGED" : "CONNECTED"
        });

    };

    private readonly _onDisconnected = (): void => {

        this.setState({
            "status": "DISCONNECTED"
        });

    };

    private readonly _onError = (data: components["schemas"]["Error"]): void => {

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

    // render

    public render (): React.JSX.Element {

        if ("DISCONNECTED" === this.state.status) {

            return <div className="container">
                <Alert variant="danger">Not connected yet...</Alert>
            </div>;

        }
        else if (![ "CONNECTED", "LOGGED" ].includes(this.state.status)) {

            return <div className="container">
                <Alert variant="warning">Unknown status: { this.state.status }</Alert>
            </div>;

        }
        else {

            return <div className="container-fluid">

                { this.state.error && <Modal appId="MIAApp" title="Error" variant="danger" centered size="sm" onClose={ this._handleCloseError }>
                    <ModalBody>
                        { this.state.error.message || "An error occurred" }
                    </ModalBody>
                </Modal> }

                { "CONNECTED" === this.state.status && <Alert variant="warning">Need to be logged in</Alert> }
                { "LOGGED" === this.state.status && <Plugins onError={ this._handleError } /> }

            </div>;

        }

    }

}
