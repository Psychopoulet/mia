// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputTextLabel,
        Button,
        generateFocus
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "./SDK";

// types & interfaces

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "./SDK";

    interface iProps extends iPropsNode {
        "onError": (err: Error) => void;
    }

    interface iState {
        "loading": boolean;
        "name": string;
        "password": string;
    }

// component

export default class Login extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "Login";

    // private

        private readonly _sdk: SDK = getSDK();
        private readonly _generateFocus: iGenerateFocusCallback = generateFocus<HTMLInputElement>();

    // constructor

    public constructor (props: iProps) {

        super(props);

        // state

        this.state = {
            "loading": false,
            "name": "",
            "password": ""
        };

    }

    public componentDidMount (): void {

        // focus

        this._generateFocus.setFocus();

    }

    // interface handlers

    private readonly _handleLogin = (e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({ "loading": true });

        this._sdk.login(this.state.name, this.state.password).then(() => {

            window.location.reload();

        }).catch((err) => {

            this.setState({ "loading": false });
            this.props.onError(err as Error);

        });

    };

    private readonly _handleChangeName = (e: React.ChangeEvent<HTMLInputElement>, newValue: string): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "name": newValue
        });

    };

    private readonly _handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>, newValue: string): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "password": newValue
        });

    };

    // render

    public render (): React.JSX.Element {

        return <div className="container-fluid">

            <Modal appId="MIAApp" title="Login to MIA" centered size="lg" onSubmit={ this._handleLogin }>

                <ModalBody>

                    <InputTextLabel label="name" disabled={ this.state.loading }
                        _ref={ this._generateFocus.ref as React.RefObject<HTMLInputElement> }
                        value={ this.state.name } onChange={ this._handleChangeName }
                    />

                    <InputTextLabel label="password" disabled={ this.state.loading }
                        value={ this.state.password } onChange={ this._handleChangePassword }
                    />

                </ModalBody>

                <ModalFooter>

                    <Button type="submit"
                        icon="unlock" variant="success" block
                        disabled={ this.state.loading }
                    >
                        Login
                    </Button>

                </ModalFooter>

            </Modal>

        </div>;

    }

}
