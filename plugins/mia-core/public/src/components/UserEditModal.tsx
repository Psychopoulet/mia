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
    import { canSetIsAdmin } from "../utils/userPermissions";
    import { CurrentUserContext } from "./CurrentUserProvider";

// types & interfaces

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { components, operations } from "../Descriptor";

    type User = components["schemas"]["User"];

    interface iProps extends iPropsNode {
        "user": User;
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
        "onUpdated": () => void;
        "onError": (err: Error) => void;
    }

    interface iState {
        "running": boolean;
        "password": string;
        "isAdmin": boolean;
    }

// component

export default class UserEditModal extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "UserEditModal";

        public static contextType: typeof CurrentUserContext = CurrentUserContext;

        declare public context: React.ContextType<typeof CurrentUserContext>;

    // private

        private readonly _generateFocus: iGenerateFocusCallback;

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "running": false,
            "password": "",
            "isAdmin": props.user.isAdmin
        };

        this._generateFocus = generateFocus<HTMLInputElement>();

    }

    public componentDidMount (): void {

        this._generateFocus.setFocus();

    }

    // interface handlers

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

    private readonly _buildUpdatePayload = (): operations["updateUser"]["requestBody"]["content"]["application/json"] => {

        const me: User | null = this.context.user;
        const data: operations["updateUser"]["requestBody"]["content"]["application/json"] = {};

        if (this.state.password) {
            data.password = this.state.password;
        }

        if (me && canSetIsAdmin(me) && this.state.isAdmin !== this.props.user.isAdmin) {
            data.isAdmin = this.state.isAdmin;
        }

        return data;

    };

    private readonly _handleSubmit = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        if (this.state.running) {
            return;
        }

        const data: operations["updateUser"]["requestBody"]["content"]["application/json"] = this._buildUpdatePayload();

        if (!Object.keys(data).length) {
            this.props.onClose();
            return;
        }

        this.setState({
            "running": true
        });

        getSDK().updateUser(this.props.user.name, data).then((): void => {

            this.props.onUpdated();
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

        const me: User | null = this.context.user;
        const showIsAdmin: boolean = Boolean(me && canSetIsAdmin(me));

        return <Modal appId="{{plugin.name}}-app" title={ "Edit " + this.props.user.name } centered
            onClose={ this.props.onClose }>

            <ModalBody className="pb-0">

                <InputTextLabel id="edit-user-name" label="Username" disabled value={ this.props.user.name } />

                <InputTextLabel id="edit-user-password" label="New password (optional)" type="password"
                    disabled={ this.state.running }
                    _ref={ this._generateFocus.ref as React.RefObject<HTMLInputElement> }
                    value={ this.state.password } onChange={ this._handleChangePassword }
                />

                { showIsAdmin && <CheckBoxLabel id="edit-user-is-admin" label="Administrator"
                    disabled={ this.state.running }
                    checked={ this.state.isAdmin } onToogle={ this._handleToggleIsAdmin }
                /> }

            </ModalBody>

            <ModalFooter>

                <Button type="button" variant="secondary" outline disabled={ this.state.running }
                    onClick={ this.props.onClose }>
                    Cancel
                </Button>

                <Button type="button" variant="primary" disabled={ this.state.running }
                    onClick={ this._handleSubmit }>
                    Save
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
