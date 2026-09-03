// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        Button
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { components } from "../Descriptor";

    type User = components["schemas"]["User"];

    interface iProps extends iPropsNode {
        "user": User;
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
        "onDeleted": () => void;
        "onError": (err: Error) => void;
    }

    interface iState {
        "running": boolean;
    }

// component

export default class UserDeleteModal extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "UserDeleteModal";

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "running": false
        };

    }

    // interface handlers

    private readonly _handleConfirm = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        if (this.state.running) {
            return;
        }

        this.setState({
            "running": true
        });

        getSDK().deleteUser(this.props.user.name).then((): void => {

            this.props.onDeleted();
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

        return <Modal appId="{{plugin.name}}-app" title="Delete user" variant="danger" centered size="sm"
            onClose={ this.props.onClose }>

            <ModalBody>
                Delete user &quot;{ this.props.user.name }&quot;? This cannot be undone.
            </ModalBody>

            <ModalFooter>

                <Button type="button" variant="secondary" outline disabled={ this.state.running }
                    onClick={ this.props.onClose }>
                    Cancel
                </Button>

                <Button type="button" variant="danger" disabled={ this.state.running }
                    onClick={ this._handleConfirm }>
                    Delete
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
