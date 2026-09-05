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

    interface iProps extends iPropsNode {
        "from": string;
        "to": string;
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
        "onPurged": () => void;
        "onError": (err: Error) => void;
    }

    interface iState {
        "running": boolean;
    }

// component

export default class LogsPurgeModal extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "LogsPurgeModal";

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

        getSDK().deleteLogs(this.props.from, this.props.to).then((): void => {

            this.props.onPurged();
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

        return <Modal appId="{{plugin.name}}-app" title="Purge logs" variant="danger" centered size="sm"
            onClose={ this.props.onClose }>

            <ModalBody>
                Delete every log between &quot;{ new Date(this.props.from).toLocaleString() }&quot;
                and &quot;{ new Date(this.props.to).toLocaleString() }&quot;? This cannot be undone.
            </ModalBody>

            <ModalFooter>

                <Button type="button" variant="secondary" outline disabled={ this.state.running }
                    onClick={ this.props.onClose }>
                    Cancel
                </Button>

                <Button type="button" variant="danger" disabled={ this.state.running }
                    onClick={ this._handleConfirm }>
                    Purge
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
