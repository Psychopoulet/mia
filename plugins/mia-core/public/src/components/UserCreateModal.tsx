// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputTextLabel, CheckBoxLabel,
        Button,
        generateFocus
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";

// types & interfaces

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { operations } from "../Descriptor";

    interface iProps extends iPropsNode {
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
        "onCreated": () => void;
        "onError": (err: Error) => void;
    }

    interface iState {
        "running": boolean;
        "name": string;
        "password": string;
        "isAdmin": boolean;
    }

// component

export default class UserCreateModal extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "UserCreateModal";

    // private

    private readonly _generateFocus: iGenerateFocusCallback;

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "running": false,
            "name": "",
            "password": "",
            "isAdmin": false
        };

        this._generateFocus = generateFocus<HTMLInputElement>();

    }

    public componentDidMount (): void {

        this._generateFocus.setFocus();

    }

    // interface handlers

    private readonly _handleChangeName = (e: React.ChangeEvent<HTMLInputElement>, value: string): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "name": value
        });

    };

    private readonly _handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>, value: string): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "password": value
        });

    };

    private readonly _handleToggleIsAdmin = (e: React.ChangeEvent<HTMLInputElement>, value: boolean): void => {

        this.setState({
            "isAdmin": value
        });

    };

    private readonly _handleSubmit = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        if (!this.state.name || !this.state.password || this.state.running) {
            return;
        }

        const data: operations["createUser"]["requestBody"]["content"]["application/json"] = {
            "name": this.state.name,
            "password": this.state.password,
            "isAdmin": this.state.isAdmin
        };

        this.setState({
            "running": true
        });

        getSDK().createUser(data).then((): void => {

            this.props.onCreated();
            this.props.onClose();

        }).catch((err: Error): void => {

            this.props.onError(err);
            this.setState({
                "running": false
            });

        });

    };

    // render

    public render (): React.JSX.Element {

        return <Modal appId="{{plugin.name}}-app" title="Create user" centered
            onClose={ this.props.onClose }>

            <ModalBody className="pb-0">

                <InputTextLabel id="create-user-name" label="Username"
                    disabled={ this.state.running }
                    _ref={ this._generateFocus.ref as React.RefObject<HTMLInputElement> }
                    value={ this.state.name } onChange={ this._handleChangeName }
                />

                <InputTextLabel id="create-user-password" label="Password" type="password"
                    disabled={ this.state.running }
                    value={ this.state.password } onChange={ this._handleChangePassword }
                />

                <CheckBoxLabel id="create-user-is-admin" label="Administrator"
                    disabled={ this.state.running }
                    checked={ this.state.isAdmin } onToogle={ this._handleToggleIsAdmin }
                />

            </ModalBody>

            <ModalFooter>

                <Button type="button" variant="secondary" outline disabled={ this.state.running }
                    onClick={ this.props.onClose }>
                    Cancel
                </Button>

                <Button type="button" variant="success" disabled={ this.state.running || !this.state.name || !this.state.password }
                    onClick={ this._handleSubmit }>
                    Create
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
