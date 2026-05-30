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
        "loading": boolean;
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
            "loading": true,
            "plugins": [],
            "error": null
        };

    }

    public componentDidMount (): void {

        this.setState({
            "plugins": [],
            "loading": true
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

    }

    public componentWillUnmount (): void {

        this.setState({
            "loading": false,
            "plugins": [],
            "error": null
        });

    }

    // render

    private readonly _renderContent = (): React.JSX.Element[] | React.JSX.Element => {

        if (this.state.loading) {

            return <li className="nav-item">
                <a className="nav-link disabled text-warning" aria-disabled="true">Loading...</a>
            </li>;

        }
        else if (this.state.error) {

            return <li className="nav-item">
                <a className="nav-link disabled text-danger" aria-disabled="true">{ this.state.error.message }</a>
            </li>;

        }

        return this.state.plugins.map((plugin: components["schemas"]["Plugin"]): React.JSX.Element => {

            return <li key={ plugin.name } className="nav-item">
                <a className="nav-link" href={ "/" + plugin.name + "/public/index.html" }>{ plugin.name }</a>
            </li>;

        });

    };

    public render (): React.JSX.Element {

        return <nav className="navbar navbar-expand-lg bg-body-tertiary">

            <div className="container-fluid">

                <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                    { this._renderContent() }

                </ul>

            </div>

        </nav>;

    }

}

createRoot(document.getElementById("MIAMenu") as HTMLElement).render(<Menu />);
