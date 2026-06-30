// deps

    // externals
    import React from "react";
    import {
        Card, CardHeader, CardList,
        ButtonGroup, Button,
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
        "plugin": components["schemas"]["Plugin"];
        "onError": (err: Error) => void;
    }

    interface iState {
        "running": boolean;
        "lastTag": string | null;
    }

// component

export default class Plugin extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "Plugin";

    // private

        private readonly _sdk: SDK = getSDK();

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "running": false,
            "lastTag": null
        };

    }

    // interface handlers

    private readonly _handleGetLastTag = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "running": true
        });

        this._sdk.getLastTag(this.props.plugin.name).then((data: operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]): void => {

            this.setState({
                "lastTag": data,
                "running": false
            });

        }).catch((err: Error): void => {

            this.props.onError(err);

            this.setState({
                "running": false
            });

        });

    };

    private readonly _handleUpdate = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "running": true
        });

        this._sdk.updatePlugin(this.props.plugin.name).catch((err: Error): void => {

            this.props.onError(err);

        }).finally((): void => {

            this.setState({
                "running": false
            });

        });

    };

    private readonly _handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "running": true
        });

        this._sdk.deletePlugin(this.props.plugin.name).catch((err: Error): void => {

            this.props.onError(err);

        }).finally((): void => {

            this.setState({
                "running": false
            });

        });

    };

    // render

    public render (): React.JSX.Element {

        return <Card>

            <CardHeader justify>

                <span>

                    { this.props.plugin.enabled
                        ? <Icon type="check" variant="success" title="Enabled" />
                        : <Icon type="times" variant="danger" title="Disabled" />
                    }

                    <a href={ "/" + this.props.plugin.name + "/public/index.html" } className="ms-1">
                        { this.props.plugin.name }
                    </a>

                </span>

                <ButtonGroup>

                    <Button title="Get last tag"
                        variant="info" icon="eye" size="sm" outline
                        disabled={ this.state.running }
                        onClick={ this._handleGetLastTag }
                    />

                    <Button title="Update plugin"
                        variant="warning" icon="cog" size="sm" outline
                        disabled={ this.state.running }
                        onClick={ this._handleUpdate }
                    />

                    <Button title="Delete plugin"
                        variant="danger" icon="trash" size="sm" outline
                        disabled={ this.state.running }
                        onClick={ this._handleDelete }
                    />

                </ButtonGroup>

            </CardHeader>

            <CardList>

                <ListItem justify>
                    Version <span>{ this.props.plugin.version }</span>
                </ListItem>

                { this.state.lastTag && <ListItem variant="secondary" justify>
                    Last tag: <span>{ this.state.lastTag }</span>
                </ListItem> }

                <ListItem justify>
                    Description <span className="text-muted">{ this.props.plugin.description }</span>
                </ListItem>

                <ListItem>

                    <span className="text-decoration-underline">Dependencies :</span>

                    <ul className="m-0">

                        { Object.keys(this.props.plugin.dependencies).map((dependency: string): React.JSX.Element => {
                            return <li key={ dependency }>{ dependency }</li>;
                        }) }

                    </ul>

                </ListItem>

                <ListItem justify>
                    Engines <span className="text-muted">{ this.props.plugin.engines.node }</span>
                </ListItem>

                <ListItem justify>
                    Authors <span className="text-muted">{ this.props.plugin.authors.join(", ") }</span>
                </ListItem>

                <ListItem justify>
                    License <span className="text-muted">{ this.props.plugin.license }</span>
                </ListItem>

            </CardList>

        </Card>;

    }

}
