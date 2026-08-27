// deps

    // locals
    import User, { type UserAttributes } from "./models/User";
    import Token, { type AuthTokenPublic, type FullAuthPublic } from "./models/Token";

// types & interfaces

    export type { AuthTokenPublic, FullAuthPublic };

    export interface AuthUserPublic {
        "name": string;
        "isAdmin": boolean;
        "createdAt": Date;
    }

    export interface iAuthDatabase {
        "addUser": (name: string, password: string, isAdmin?: boolean) => Promise<void>,
        "editUserPassword": (name: string, password: string) => Promise<void>,
        "editUserIsAdmin": (name: string, isAdmin: boolean) => Promise<void>,
        "getUserByToken": (token: string) => Promise<FullAuthPublic | undefined>,
        "getUserByNameAndPassword": (name: string, password: string) => Promise<AuthUserPublic | undefined>,
        "getUserByName": (name: string) => Promise<AuthUserPublic | undefined>,
        "getUsers": () => Promise<AuthUserPublic[]>,
        "getTokensByUserName": (name: string) => Promise<AuthTokenPublic[]>,
        "addToken": (name: string, token: string, fingerprint: string) => Promise<void>,
        "removeToken": (token: string) => Promise<void>,
        "removeUser": (name: string) => Promise<void>
    }

// private

    function toDate (value: Date | string): Date {

        return "string" === typeof value
            ? new Date(value)
            : value;

    }

    function toAuthUserPublic (user: Pick<UserAttributes, "name" | "isAdmin" | "createdAt">): AuthUserPublic {

        return {
            "name": user.name,
            "isAdmin": Boolean(user.isAdmin),
            "createdAt": toDate(user.createdAt)
        };

    }

// module

const authDatabase: iAuthDatabase = {

    addUser (name: string, password: string, isAdmin: boolean = false): Promise<void> {

        return User.create({
            "name": name,
            "password": password,
            "isAdmin": isAdmin
        }).then((): void => {

            return undefined;

        });

    },

    editUserPassword (name: string, password: string): Promise<void> {

        return User.update({
            "password": password
        }, {
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    },

    editUserIsAdmin (name: string, isAdmin: boolean): Promise<void> {

        return User.update({
            "isAdmin": isAdmin
        }, {
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    },

    getUserByToken (token: string): Promise<FullAuthPublic | undefined> {

        return Token.getUserByToken(token);

    },

    getUserByNameAndPassword (name: string, password: string): Promise<AuthUserPublic | undefined> {

        return User.getByNameAndPassword(name, password).then((user: UserAttributes | undefined): AuthUserPublic | undefined => {

            if (!user) {
                return undefined;
            }

            return toAuthUserPublic(user);

        });

    },

    getUserByName (name: string): Promise<AuthUserPublic | undefined> {

        return User.findOne({
            "where": {
                "name": name
            }
        }).then((user: User | null): AuthUserPublic | undefined => {

            if (!user) {
                return undefined;
            }

            return toAuthUserPublic(user);

        });

    },

    getUsers (): Promise<AuthUserPublic[]> {

        return User.findAll({
            "order": [ [ "name", "ASC" ] ]
        }).then((users: User[]): AuthUserPublic[] => {

            return users.map(toAuthUserPublic);

        });

    },

    getTokensByUserName (name: string): Promise<AuthTokenPublic[]> {

        return Token.getByUserName(name);

    },

    addToken (name: string, token: string, fingerprint: string): Promise<void> {

        return User.findOne({
            "where": {
                "name": name
            },
            "attributes": [ "id" ]
        }).then((user: User | null): Promise<void> => {

            if (!user) {
                return Promise.reject(new Error("User not found"));
            }

            return Token.create({
                "idUser": user.id,
                "token": token,
                "fingerprint": fingerprint
            }).then((): void => {

                return undefined;

            });

        });

    },

    removeToken (token: string): Promise<void> {

        return Token.destroy({
            "where": {
                "token": token
            }
        }).then((): void => {

            return undefined;

        });

    },

    removeUser (name: string): Promise<void> {

        return User.destroy({
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    }

};

export default authDatabase;
