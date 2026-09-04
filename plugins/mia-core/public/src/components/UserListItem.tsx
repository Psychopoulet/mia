// deps

    // externals
    import React from "react";
    import {
        Icon,
        Button, ButtonGroup
    } from "react-bootstrap-fontawesome";

    // locals
    import {
        canDeleteUser,
        canEditUser,
        canManageUserTokens
    } from "../utils/userPermissions";
    import { CurrentUserContext } from "./CurrentUserProvider";

// types & interfaces

    // externals
    import type { iPropsNode } from "react-bootstrap-fontawesome";

    // locals
    import type { components } from "../Descriptor";

    type User = components["schemas"]["User"];

    interface iProps extends iPropsNode {
        "user": User;
        "onEdit": (user: User) => void;
        "onDelete": (user: User) => void;
        "onTokens": (user: User) => void;
    }

// component

export default class UserListItem extends React.Component<iProps> {

    // name

        public static displayName: string = "UserListItem";

        public static contextType: typeof CurrentUserContext = CurrentUserContext;

        declare public context: React.ContextType<typeof CurrentUserContext>;

    // interface handlers

    private readonly _handleEdit = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.props.onEdit(this.props.user);

    };

    private readonly _handleDelete = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.props.onDelete(this.props.user);

    };

    private readonly _handleTokens = (e: React.MouseEvent<HTMLButtonElement>): void => {

        e.preventDefault();
        e.stopPropagation();

        this.props.onTokens(this.props.user);

    };

    // render

    public render (): React.JSX.Element | null {

        const me: User | null = this.context.user;

        if (!me) {
            return null;
        }

        const target: User = this.props.user;
        const showEdit: boolean = canEditUser(me, target.name);
        const showDelete: boolean = canDeleteUser(me, target.name);
        const showTokens: boolean = canManageUserTokens(me, target.name);

        return <tr>

            <td>
                { target.name }
            </td>

            <td>
                { target.isAdmin && <Icon variant="success" type="check" /> }
            </td>

            <td>
                <small className="text-muted">{ new Date(target.createdAt).toLocaleString() }</small>
            </td>

            <td>

                <ButtonGroup block>

                    { showTokens && <Button title="Tokens" icon="fingerprint" variant="info" outline size="sm"
                        onClick={ this._handleTokens }
                    /> }

                    { showEdit && <Button title="Edit user" icon="edit" variant="primary" outline size="sm"
                        onClick={ this._handleEdit }
                    /> }

                    { showDelete && <Button title="Delete user" icon="trash" variant="danger" outline size="sm"
                        onClick={ this._handleDelete }
                    /> }

                </ButtonGroup>

            </td>

        </tr>;

    }

}
