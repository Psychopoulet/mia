// deps

    // externals
    import React from "react";

    // locals
    import getSDK from "../SDK";
    import decodeAuthTokenName from "../utils/decodeAuthTokenName";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { components } from "../Descriptor";

    type User = components["schemas"]["User"];

    interface iCurrentUserContext {
        "user": User | null;
        "loading": boolean;
    }

    interface iProps extends iPropsNode {
        "onError": (err: Error) => void;
    }

    interface iState {
        "user": User | null;
        "loading": boolean;
    }

// context

export const CurrentUserContext: React.Context<iCurrentUserContext> = React.createContext<iCurrentUserContext>({
    "user": null,
    "loading": true
});

// component

export default class CurrentUserProvider extends React.Component<iProps, iState> {

    // name

        public static displayName: string = "CurrentUserProvider";

    // constructor

    public constructor (props: iProps) {

        super(props);

        this.state = {
            "user": null,
            "loading": true
        };

    }

    public componentDidMount (): void {

        const token: string | null = localStorage.getItem("MIAApp-token-auth");
        const name: string | null = null !== token ? decodeAuthTokenName(token) : null;

        if (null === name) {

            this.props.onError(new Error("Impossible to resolve current user from auth token"));
            this.setState({
                "loading": false
            });

            return;

        }

        getSDK().getUser(name).then((user: User): void => {

            this.setState({
                "user": user,
                "loading": false
            });

        }).catch((err: Error): void => {

            this.props.onError(err);
            this.setState({
                "loading": false
            });

        });

    }

    // render

    public render (): React.JSX.Element {

        return <CurrentUserContext.Provider value={{
            "user": this.state.user,
            "loading": this.state.loading
        }}>
            { this.props.children }
        </CurrentUserContext.Provider>;

    }

}
