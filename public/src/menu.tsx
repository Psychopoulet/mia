// deps

    // externals
    import React from "react";
    import { createRoot } from "react-dom/client";

    // locals
    import getSDK from "./SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "./SDK";
    import type { components, operations } from "./Descriptor";

    interface iState {
        "status": "DISCONNECTED" | "CONNECTED" | "LOADING" | "LOADED";
        "plugins": components["schemas"]["Plugin"][];
        "error": components["schemas"]["Error"] | null;
    }

// private

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
            "error": null
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

    // render

    private readonly _renderContent = (): React.JSX.Element[] | React.JSX.Element => {

        if ("LOADING" === this.state.status) {

            return <li className="nav-item">
                <a className="nav-link disabled text-info" aria-disabled="true">Loading...</a>
            </li>;

        }
        else if ("CONNECTED" === this.state.status && this.state.error) {

            return <li className="nav-item">
                <a className="nav-link disabled text-danger" aria-disabled="true">{ this.state.error.message }</a>
            </li>;

        }
        else if (0 >= this.state.plugins.length) {

            return <li className="nav-item">
                <a className="nav-link disabled text-warning" aria-disabled="true">No plugins found</a>
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

        return <nav className="navbar navbar-expand">

            <div className="container-fluid">

                <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                    { this._renderContent() }

                </ul>

            </div>

        </nav>;

    }

}

createRoot(document.getElementById("MIAMenu") as HTMLElement).render(<Menu />);
