// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputText,
        InvalidFeedBack,
        Button
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../src/SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

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

    // constructor

    public constructor (props: iProps) {

        super(props);

        // state

        this.state = {
            "running": false,
            "error": null,
            "user": "",
            "repository": ""
        };

    }

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
            "running": true,
            "error": null
        });

        this._sdk.installPlugin("https://github.com/" + this.state.user + "/" + this.state.repository).then((): void => {

            this.setState({
                "running": false
            });

            this.props.onClose();

        }).catch((err: Error): void => {

            this.setState({
                "running": false,
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

                <div className="input-group mb-3">
                    <span className="input-group-text">https://github.com/</span>
                    <InputText value={ this.state.user } disabled={ this.state.running } onChange={ this._handleChangeUser } />
                    <span className="input-group-text">/</span>
                    <InputText value={ this.state.repository } disabled={ this.state.running } onChange={ this._handleChangeRepository } />
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
