// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalTable, ModalFooter,
        TableHeader, TableBody,
        Button, ButtonGroup, Alert
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { operations } from "../Descriptor";

    type TokenRow = operations["getUserTokens"]["responses"]["200"]["content"]["application/json"][number];

    interface iProps extends iPropsNode {
        "userName": string;
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
        "onError": (err: Error) => void;
    }

    interface iState {
        "loading": boolean;
        "running": boolean;
        "tokens": TokenRow[];
    }

// component

export default class UserTokensModal extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "UserTokensModal";

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "loading": true,
            "running": false,
            "tokens": []
        };

    }

    public componentDidMount (): void {

        this._loadTokens();

    }

    // private

    private _loadTokens (): void {

        this.setState({
            "loading": true
        });

        getSDK().getUserTokens(this.props.userName).then((tokens: TokenRow[]): void => {

            this.setState({
                "loading": false,
                "tokens": tokens
            });

        }).catch((err: Error): void => {

            this.props.onError(err);
            this.setState({
                "loading": false
            });

        });

    }

    // interface handlers

    private readonly _handleDeleteToken = (token: string): (e: React.MouseEvent<HTMLButtonElement>) => void => {

        return (e: React.MouseEvent<HTMLButtonElement>): void => {

            e.preventDefault();
            e.stopPropagation();

            if (this.state.running) {
                return;
            }

            this.setState({
                "running": true
            });

            getSDK().deleteToken({
                "token": token
            }).then((): void => {

                this.setState({
                    "running": false,
                    "tokens": this.state.tokens.filter((row: TokenRow): boolean => {
                        return row.token !== token;
                    })
                });

            }).catch((err: Error): void => {

                this.props.onError(err);
                this.setState({
                    "running": false
                });

            });

        };

    };

    // render

    public render (): React.JSX.Element {

        return <Modal appId="{{plugin.name}}-app" title={ "Tokens — " + this.props.userName }
            centered size="lg"
            onClose={ this.props.onClose }>

            { this.state.loading && <ModalBody><Alert variant="info">Loading tokens...</Alert></ModalBody> }

            { !this.state.loading && !this.state.tokens.length && <ModalBody><Alert variant="secondary">No tokens</Alert></ModalBody> }

            { !this.state.loading && 0 < this.state.tokens.length && <ModalTable>

                <TableHeader>
                    <tr>
                        <th>Fingerprint</th>
                        <th>Created at</th>
                        <th></th>
                    </tr>
                </TableHeader>

                <TableBody>

                    { this.state.tokens.map((row: TokenRow): React.JSX.Element => {

                        return <tr key={ row.token }>

                            <td>
                                <code>{ row.fingerprint || row.token.slice(0, 12) + "…" }</code>
                            </td>

                            <td>
                                { new Date(row.createdAt).toLocaleString() }
                            </td>

                            <td>

                                <ButtonGroup block>

                                    <Button title="Delete token"
                                        icon="trash" variant="danger" outline size="sm"
                                        disabled={ this.state.running }
                                        onClick={ this._handleDeleteToken(row.token) }
                                    />

                                </ButtonGroup>

                            </td>

                        </tr>;

                    }) }

                </TableBody>

            </ModalTable> }

            <ModalFooter>

                <Button type="button" variant="secondary" outline onClick={ this.props.onClose }>
                    Close
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
