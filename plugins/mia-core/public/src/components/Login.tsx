// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputTextLabel,
        InvalidFeedBack,
        Button,
        generateFocus
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";

// types & interfaces

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../SDK";

    interface iState {
        "error": Error | null,
        "loading": boolean;
        "name": string;
        "password": string;
    }

// component

export default class Login extends React.Component<iPropsNode, iState> {

    // name

        public static displayName: string = "Login";

    // private

        private readonly _sdk: SDK = getSDK();
        private readonly _generateFocus: iGenerateFocusCallback = generateFocus<HTMLInputElement>();

    // constructor

    public constructor (props: iPropsNode) {

        super(props);

        // state

        this.state = {
            "loading": false,
            "error": null,
            "name": "",
            "password": ""
        };

    }

    public componentDidMount (): void {

        // focus

        setTimeout((): void => {
            this._generateFocus.setFocus();
        }, 200);

    }

    // interface handlers

    private readonly _handleLogin = (e: React.SubmitEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({ "loading": true });

        this._sdk.login(this.state.name, this.state.password).then((): void => {

            window.location.reload();

        }).catch((err: Error): void => {

            this.setState({
                "loading": false,
                "error": err
            });

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

            <Modal appId="{{plugin.name}}-app" title="Login to MIA" centered size="lg" onSubmit={ this._handleLogin }>

                <ModalBody>

                    <InputTextLabel label="name" disabled={ this.state.loading }
                        _ref={ this._generateFocus.ref as React.RefObject<HTMLInputElement> }
                        value={ this.state.name } onChange={ this._handleChangeName }
                    />

                    <InputTextLabel type="password" label="password" disabled={ this.state.loading }
                        value={ this.state.password } onChange={ this._handleChangePassword }
                    />

                    { this.state.error && <InvalidFeedBack alert={ this.state.error.message } /> }

                </ModalBody>

                <ModalFooter>

                    <Button type="submit" title="Login"
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
