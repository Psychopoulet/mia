// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputText,
        InvalidFeedBack,
        Button,
        generateFocus
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../src/SDK";

// types & interfaces

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../src/SDK";

    interface iProps extends iPropsNode {
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
    }

    interface iState {
        "running": boolean;
        "error": Error | null;
        "user": string;
        "repository": string;
    }

// component

export default class ModalAddPluginFromGithub extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "ModalAddPluginFromGithub";

    // private

        private readonly _sdk: SDK = getSDK();
        private readonly _generateFocus: iGenerateFocusCallback = generateFocus<HTMLInputElement>();

    // constructor

    public constructor (props: iProps) {

        super(props);

        // state

        this.state = {
            "running": false,
            "error": null,
            "user": "Psychopoulet",
            "repository": ""
        };

    }

    public componentDidMount (): void {

        this._sdk
            .on("plugin-install-running", this._onPluginInstallRunning)
            .on("plugin-install-success", this._onPluginInstallSuccess)
            .on("plugin-install-fail", this._onPluginInstallFail);

        // focus

        this._generateFocus.setFocus();

    }

    public componentWillUnmount (): void {

        this._sdk
            .off("plugin-install-running", this._onPluginInstallRunning)
            .off("plugin-install-success", this._onPluginInstallSuccess)
            .off("plugin-install-fail", this._onPluginInstallFail);

    }

    // sdk events

    private readonly _onPluginInstallRunning = (): void => {

        this.setState({
            "running": true
        });
    };

    private readonly _onPluginInstallSuccess = (): void => {

        this.setState({
            "running": false
        });
    };

    private readonly _onPluginInstallFail = (): void => {

        this.setState({
            "running": false
        });
    };

    // interface handlers

    private readonly _handleChangeUser = (e: React.ChangeEvent<HTMLInputElement>, value: string): void => {

        this.setState({
            "user": value
        });

    };

    private readonly _handleChangeRepository = (e: React.ChangeEvent<HTMLInputElement>, value: string): void => {

        this.setState({
            "repository": value
        });
    };

    private readonly _handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "error": null
        });

        this._sdk.installPlugin("https://github.com/" + this.state.user + "/" + this.state.repository).then((): void => {

            this.props.onClose();

        }).catch((err: Error): void => {

            this.setState({
                "error": err
            });

        });

    };

    // render

    public render (): React.JSX.Element {

        return <Modal appId="MIAMenu" title="Repository URL" centered
            onClose={ this.props.onClose }
            onSubmit={ this._handleSubmit }
        >

            <ModalBody>

                <div className={ "input-group" + (this.state.error ? " mb-2" : "") }>

                    <span className="input-group-text">https://github.com/</span>

                    <InputText disabled={ this.state.running }
                        value={ this.state.user } onChange={ this._handleChangeUser }
                    />

                    <span className="input-group-text">/</span>

                    <InputText disabled={ this.state.running }
                        value={ this.state.repository } onChange={ this._handleChangeRepository }
                        _ref={ this._generateFocus.ref as React.RefObject<HTMLInputElement> }
                    />

                </div>

                { this.state.error && <InvalidFeedBack alert={ this.state.error.message } /> }

            </ModalBody>

            <ModalFooter>

                <Button type="submit"
                    variant="success" outline icon="plus" block
                    disabled={ this.state.running }
                    onClick={ this._handleSubmit }
                >
                    Add plugin
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
