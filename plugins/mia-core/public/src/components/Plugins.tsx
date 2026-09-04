// deps

    // externals
    import React from "react";
    import {
        Alert,
        Card, CardHeader, CardBody
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";
    import Plugin from "./Plugin";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../SDK";
    import type { operations, components } from "../Descriptor";

// props & state

    interface iProps extends iPropsNode {
        "onError": (err: Error) => void;
    }

    interface iState {
        "loading": boolean;
        "plugins": Array<components["schemas"]["Plugin"]>;
    }

// component

export default class Plugins extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "Plugins";

    // private

        private readonly _sdk: SDK = getSDK();

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "loading": true,
            "plugins": []
        };

    }

    public componentDidMount (): void {

        this._sdk.getPlugins().then((plugins: operations["getPlugins"]["responses"]["200"]["content"]["application/json"]): void => {

            this.setState({
                "plugins": plugins,
                "loading": false
            });

        }).catch((err: Error): void => {

            this.setState({ "loading": false });
            this.props.onError(err);

        });

        this._sdk
            .on("plugin-install-success", this._onPluginsChange)
            .on("plugin-update-success", this._onPluginsChange)
            .on("plugin-uninstall-success", this._onPluginsChange);

    }

    public componentWillUnmount (): void {

        this._sdk
            .off("plugin-install-success", this._onPluginsChange)
            .off("plugin-update-success", this._onPluginsChange)
            .off("plugin-uninstall-success", this._onPluginsChange);

    }

    // sdk events

    private readonly _onPluginsChange = (): void => {

        this._sdk.getPlugins().then((plugins: operations["getPlugins"]["responses"]["200"]["content"]["application/json"]): void => {

            this.setState({
                "plugins": plugins,
                "loading": false
            });

        }).catch((err: Error): void => {

            this.setState({ "loading": false });
            this.props.onError(err);

        });

    };

    // render

    public render (): React.JSX.Element {

        if (this.state.loading) {

            return <Alert variant="info">Loading...</Alert>;

        }
        else {

            return <Card>

                <CardHeader>Plugins</CardHeader>

                <CardBody>

                    { this.state.plugins.length ? <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">

                        { this.state.plugins.map((plugin: components["schemas"]["Plugin"]): React.JSX.Element => {

                            return <div key={ plugin.name } className="col">

                                <Plugin plugin={ plugin } onError={ this.props.onError } />

                            </div>;

                        }) }

                    </div> : "No plugins found" }

                </CardBody>

            </Card>;

        }

    }

}
