// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        Button
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../src/SDK";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../src/SDK";
    import type { components } from "../src/Descriptor";

    interface iState {
        "type": "closed" | "install" | "update";
        "step": components["schemas"]["PushEventPluginInstallStep"]["data"] | null;
        "error": components["schemas"]["PushEventPluginInstallFail"]["data"] | null;
    }

// component

export default class ModalPluginOperation extends React.Component<iPropsNode, iState> {

    // name

        public static displayName: string = "ModalPluginOperation";

    // private

        private readonly _sdk: SDK = getSDK();

    // constructor

    public constructor (props: iPropsNode) {

        super(props);

        // state

        this.state = {
            "type": "closed",
            "step": null,
            "error": null
        };

    }

    public componentDidMount (): void {

        this._sdk

            .on("plugin-install-running", this._onPluginInstallRunning)
            .on("plugin-install-step", this._onPluginInstallStep)
            .on("plugin-install-success", this._onPluginInstallSuccess)
            .on("plugin-install-fail", this._onPluginInstallFail)

            .on("plugin-update-running", this._onPluginUpdateRunning)
            .on("plugin-update-step", this._onPluginUpdateStep)
            .on("plugin-update-success", this._onPluginUpdateSuccess)
            .on("plugin-update-fail", this._onPluginUpdateFail);

    }

    public componentWillUnmount (): void {

        this._sdk

            .off("plugin-install-running", this._onPluginInstallRunning)
            .off("plugin-install-step", this._onPluginInstallStep)
            .off("plugin-install-success", this._onPluginInstallSuccess)
            .off("plugin-install-fail", this._onPluginInstallFail)

            .off("plugin-update-running", this._onPluginUpdateRunning)
            .off("plugin-update-step", this._onPluginUpdateStep)
            .off("plugin-update-success", this._onPluginUpdateSuccess)
            .off("plugin-update-fail", this._onPluginUpdateFail);

    }

    // sdk events

    private readonly _onPluginInstallRunning = (): void => {

        this.setState({
            "type": "install",
            "step": null,
            "error": null
        });

    };

    private readonly _onPluginInstallStep = (step: components["schemas"]["PushEventPluginInstallStep"]["data"]): void => {

        this.setState({
            "type": "install",
            "step": step,
            "error": null
        });

    };

    private readonly _onPluginInstallSuccess = (): void => {

        this.setState({
            "type": "closed",
            "step": null,
            "error": null
        });

    };

    private readonly _onPluginInstallFail = (error: components["schemas"]["PushEventPluginInstallFail"]["data"]): void => {

        this.setState({
            "type": "install",
            "step": null,
            "error": error
        });

    };

    private readonly _onPluginUpdateRunning = (): void => {

        this.setState({
            "type": "update",
            "step": null,
            "error": null
        });

    };

    private readonly _onPluginUpdateStep = (step: components["schemas"]["PushEventPluginUpdateStep"]["data"]): void => {

        this.setState({
            "type": "update",
            "step": step,
            "error": null
        });

    };

    private readonly _onPluginUpdateSuccess = (): void => {

        this.setState({
            "type": "closed",
            "step": null,
            "error": null
        });

    };

    private readonly _onPluginUpdateFail = (error: components["schemas"]["PushEventPluginUpdateFail"]["data"]): void => {

        this.setState({
            "type": "update",
            "step": null,
            "error": error
        });

    };

    // interface handlers

    private readonly _handleClose = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.setState({
            "type": "closed",
            "step": null,
            "error": null
        });

    };

    // render

    public render (): React.JSX.Element | undefined {

        if ("closed" === this.state.type) {
            return undefined;
        }

        return <Modal appId="MIAMenu"
            title={ "install" === this.state.type ? "Install plugin running" : "Update plugin running" }
            centered size="md"
        >

            <ModalBody>

                { this.state.error && <span className="text-danger">{ this.state.error.error }</span> }
                { this.state.step && <div className="form-text">{ this.state.step.currentStep } / { this.state.step.maxSteps } - { this.state.step.stepMessage }</div> }

            </ModalBody>

            { this.state.error && <ModalFooter>

                <Button type="button"
                    variant="danger" outline icon="times" block
                    onClick={ this._handleClose }
                >
                    Add plugin
                </Button>

            </ModalFooter> }

        </Modal>;

    }

}
