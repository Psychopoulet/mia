// deps

    // externals
    import React from "react";
    import {
        Modal, ModalBody, ModalFooter,
        InputReadOnly, InputText, Select,
        InvalidFeedBack,
        Button,
        generateFocus
    } from "react-bootstrap-fontawesome";

    // locals
    import getSDK from "../src/SDK";
    import downloadGithubRepositories from "./utils/downloadGithubRepositories";

// types & interfaces

    // natives
    type Timeout = ReturnType<typeof setTimeout>;

    // externals
    import type { iPropsNode, iGenerateFocusCallback } from "react-bootstrap-fontawesome";

    // locals
    import type { SDK } from "../src/SDK";
    import type { components } from "../src/Descriptor";

    interface iProps extends iPropsNode {
        "onClose": (e?: React.MouseEvent<HTMLButtonElement>) => void;
    }

    interface iState {
        "running": boolean;
        "loading": boolean;
        "step": components["schemas"]["PushEventPluginInstallStep"]["data"] | null;
        "error": Error | null;
        "user": string;
        "repository": string;
        "repositories": string[];
    }

// consts

    const REPOSITORIES_DELAY: number = 400;

// component

export default class ModalAddPluginFromGithub extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "ModalAddPluginFromGithub";

    // private

        private readonly _sdk: SDK = getSDK();
        private readonly _generateFocus: iGenerateFocusCallback<HTMLSelectElement> = generateFocus<HTMLSelectElement>();
        private _repositoriesTimeout: Timeout | null = null;
        private _repositoriesRequest: number = 0;

    // constructor

    public constructor (props: iProps) {

        super(props);

        // state

        this.state = {
            "running": false,
            "step": null,
            "error": null,
            "user": "Psychopoulet",
            "repository": "",
            "repositories": [],
            "loading": true
        };

    }

    public componentDidMount (): void {

        this._sdk
            .on("plugin-install-running", this._onPluginInstallRunning)
            .on("plugin-install-step", this._onPluginInstallStep)
            .on("plugin-install-success", this._onPluginInstallSuccess)
            .on("plugin-install-fail", this._onPluginInstallFail);

        this._loadRepositories(this.state.user, this._repositoriesRequest);

    }

    public componentWillUnmount (): void {

        this._repositoriesRequest++;

        if (null !== this._repositoriesTimeout) {
            clearTimeout(this._repositoriesTimeout);
            this._repositoriesTimeout = null;
        }

        this._sdk
            .off("plugin-install-running", this._onPluginInstallRunning)
            .off("plugin-install-step", this._onPluginInstallStep)
            .off("plugin-install-success", this._onPluginInstallSuccess)
            .off("plugin-install-fail", this._onPluginInstallFail);

    }

    // sdk events

    private readonly _onPluginInstallRunning = (): void => {

        this.setState({
            "running": true
        });

    };

    private readonly _onPluginInstallStep = (step: components["schemas"]["PushEventPluginInstallStep"]["data"]): void => {

        this.setState({
            "running": true,
            "step": step
        });

    };

    private readonly _onPluginInstallSuccess = (): void => {

        this.setState({
            "running": false,
            "step": null
        });

    };

    private readonly _onPluginInstallFail = (): void => {

        this.setState({
            "running": false,
            "step": null
        });

    };

    // repositories

    private readonly _scheduleRepositories = (user: string): void => {

        if (null !== this._repositoriesTimeout) {
            clearTimeout(this._repositoriesTimeout);
            this._repositoriesTimeout = null;
        }

        this._repositoriesRequest++;

        const name: string = user.trim();

        if ("" === name) {

            this.setState({
                "loading": false,
                "repositories": [],
                "repository": ""
            });

            return;

        }

        this.setState({
            "loading": true,
            "repositories": [],
            "repository": "",
            "error": null
        });

        const request: number = this._repositoriesRequest;

        this._repositoriesTimeout = setTimeout((): void => {

            this._repositoriesTimeout = null;
            this._loadRepositories(name, request);

        }, REPOSITORIES_DELAY);

    };

    private readonly _loadRepositories = (user: string, request: number): void => {

        this.setState({
            "loading": true
        });

        downloadGithubRepositories(user).then((repositories: string[]): void => {

            if (request !== this._repositoriesRequest) {
                return;
            }

            this.setState({
                "loading": false,
                "repositories": repositories,
                "repository": repositories[0] ?? ""
            }, (): void => {

                if (0 < this.state.repositories.length) {
                    this._generateFocus.setFocus();
                }

            });

        }).catch((err: Error): void => {

            if (request !== this._repositoriesRequest) {
                return;
            }

            this.setState({
                "loading": false,
                "repositories": [],
                "repository": "",
                "error": err
            });

        });

    };

    // interface handlers

    private readonly _handleChangeUser = (e: React.ChangeEvent<HTMLInputElement>, value: string): void => {

        this.setState({
            "user": value
        });

        this._scheduleRepositories(value);

    };

    private readonly _handleChangeRepository = (e: React.ChangeEvent<HTMLSelectElement>, value: string): void => {

        this.setState({
            "repository": value
        });

    };

    private readonly _handleSubmit = (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        const user: string = this.state.user.trim();
        const repository: string = this.state.repository;

        if ("" === user || "" === repository || this.state.running) {
            return;
        }

        this.setState({
            "error": null
        });

        this._sdk.installPluginFromGithub("https://github.com/" + user + "/" + repository).then((): void => {

            this.props.onClose();

        }).catch((err: Error): void => {

            this.setState({
                "error": err
            });

        });

    };

    // render

    public render (): React.JSX.Element {

        const repositoryDisabled: boolean = this.state.running || this.state.loading || 0 === this.state.repositories.length;

        return <Modal appId="MIAMenu" title="Repository URL"
            centered size="lg"
            onClose={ this.props.onClose }
            onSubmit={ this._handleSubmit }
        >

            <ModalBody>

                <div className={ "input-group" + (this.state.error ? " mb-2" : "") }>

                    <InputReadOnly value="https://github.com" disabled={ this.state.running } />

                    <span className="input-group-text">/</span>

                    <InputText disabled={ this.state.running }
                        value={ this.state.user } onChange={ this._handleChangeUser }
                    />

                    <span className="input-group-text">/</span>

                    <Select disabled={ repositoryDisabled }
                        value={ this.state.repository } onChange={ this._handleChangeRepository }
                        _ref={ this._generateFocus.ref }
                    >

                        { 0 === this.state.repositories.length
                            ? <option value="">{ this.state.loading ? "Loading..." : "No repository" }</option>
                            : this.state.repositories.map((name: string): React.JSX.Element => {
                                return <option key={ name } value={ name }>{ name }</option>;
                            })
                        }

                    </Select>

                </div>

                { this.state.error && <InvalidFeedBack alert={ this.state.error.message } /> }

                { this.state.step && <div className="form-text">{ this.state.step.currentStep } / { this.state.step.maxSteps } - { this.state.step.stepMessage }</div> }

            </ModalBody>

            <ModalFooter>

                <Button type="submit"
                    variant="success" outline icon="plus" block
                    disabled={ this.state.running || this.state.loading || "" === this.state.repository }
                    onClick={ this._handleSubmit }
                >
                    Add plugin
                </Button>

            </ModalFooter>

        </Modal>;

    }

}
