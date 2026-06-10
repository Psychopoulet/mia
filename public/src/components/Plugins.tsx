// deps

    // externals
    import React from "react";
    import {
        Alert,
        Card, CardHeader, CardBody, CardList,
        ListItem,
        Icon
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";

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
        "plugins": components["schemas"]["Plugin"][];
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
            .on("plugin-install-success", this._onPluginInstallSuccess);

    }

    public componentWillUnmount (): void {

        this._sdk
            .off("plugin-install-success", this._onPluginInstallSuccess);

    }

    // sdk events

    private readonly _onPluginInstallSuccess = (data: components["schemas"]["PushEventPluginInstallSuccess"]["data"]): void => {

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

                                <Card>

                                    <CardHeader justify>

                                        <a href={ "/" + plugin.name + "/public/index.html" }>
                                            { plugin.name }
                                        </a>

                                        { plugin.enabled
                                            ? <Icon type="check" variant="success" title="Enabled" />
                                            : <Icon type="times" variant="danger" title="Disabled" />
                                        }

                                    </CardHeader>

                                    <CardList>

                                        <ListItem justify>
                                            Version <span>{ plugin.version }</span>
                                        </ListItem>

                                        <ListItem justify>
                                            Description <span className="text-muted">{ plugin.description }</span>
                                        </ListItem>

                                        <ListItem>

                                            <span className="text-decoration-underline">Dependencies :</span>

                                            <ul className="m-0">

                                                { Object.keys(plugin.dependencies).map((dependency: string): React.JSX.Element => {
                                                    return <li key={ dependency }>{ dependency }</li>;
                                                }) }

                                            </ul>

                                        </ListItem>

                                        <ListItem justify>
                                            Engines <span className="text-muted">{ plugin.engines.node }</span>
                                        </ListItem>

                                        <ListItem justify>
                                            Authors <span className="text-muted">{ plugin.authors.join(", ") }</span>
                                        </ListItem>

                                        <ListItem justify>
                                            License <span className="text-muted">{ plugin.license }</span>
                                        </ListItem>

                                    </CardList>

                                </Card>

                            </div>;

                        }) }

                    </div> : "No plugins found" }

                </CardBody>

            </Card>;

        }

    }

}
