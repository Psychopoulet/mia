// deps

    // locals
    import User from "./models/User";
    import Token from "./models/Token";

// types & interfaces

    // locals
    import type { AuthUserPublic } from "./models/User";
    export type { AuthUserPublic };

    export interface AuthTokenPublic {
        "token": string;
        "fingerprint": string;
        "createdAt": Date;
    }

    export interface FullAuthPublic {
        "name": string;
        "isAdmin": boolean;
        "token": string;
    }

// module

function toDate (value: Date | string): Date {

    return "string" === typeof value
        ? new Date(value)
        : value;

}

export default class AuthDatabase {

    private _getUserIdByName (name: string): Promise<number | undefined> {

        return User.findOne({
            "where": {
                "name": name
            },
            "attributes": [ "id" ]
        }).then((user: User | null): number | undefined => {

            return user ? user.id : undefined;

        });

    }

    public addUser (name: string, password: string, isAdmin: boolean = false): Promise<void> {

        return User.create({
            "name": name,
            "password": password,
            "isAdmin": isAdmin
        }).then((): void => {

            return undefined;

        });

    }

    public editUserPassword (name: string, password: string): Promise<void> {

        return User.update({
            "password": password
        }, {
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    }

    public editUserIsAdmin (name: string, isAdmin: boolean): Promise<void> {

        return User.update({
            "isAdmin": isAdmin
        }, {
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    }

    public getUserByToken (token: string): Promise<FullAuthPublic | undefined> {

        return Token.findOne({
            "where": {
                "token": token
            },
            "include": [
                {
                    "model": User,
                    "required": true
                }
            ]
        }).then((row: Token | null): FullAuthPublic | undefined => {

            if (!row) {
                return undefined;
            }

            const user: User | undefined = row.get("User") as User | undefined;

            if (!user) {
                return undefined;
            }

            return {
                "name": user.name,
                "isAdmin": Boolean(user.isAdmin),
                "token": row.token
            };

        });

    }

    public getUserByNameAndPassword (name: string, password: string): Promise<AuthUserPublic | undefined> {

        return User.getByNameAndPassword(name, password);

    }

    public getUserByName (name: string): Promise<AuthUserPublic | undefined> {

        return User.findOne({
            "where": {
                "name": name
            }
        }).then((user: User | null): AuthUserPublic | undefined => {

            return user
                ? user.toPublic()
                : undefined;

        });

    }

    public getUsers (): Promise<AuthUserPublic[]> {

        return User.findAll({
            "order": [ [ "name", "ASC" ] ]
        }).then((users: User[]): AuthUserPublic[] => {

            return users.map((user: User): AuthUserPublic => {

                return user.toPublic();

            });

        });

    }

    public getTokensByUserName (name: string): Promise<AuthTokenPublic[]> {

        return this._getUserIdByName(name).then((idUser: number | undefined): Promise<Token[]> => {

            if ("undefined" === typeof idUser) {
                return Promise.resolve([]);
            }

            return Token.findAll({
                "where": {
                    "idUser": idUser
                }
            });

        }).then((tokens: Token[]): AuthTokenPublic[] => {

            return tokens.map((token: Token): AuthTokenPublic => {

                return {
                    "token": token.token,
                    "fingerprint": token.fingerprint,
                    "createdAt": toDate(token.createdAt)
                };

            });

        });

    }

    public addToken (name: string, token: string, fingerprint: string): Promise<void> {

        return this._getUserIdByName(name).then((idUser: number | undefined): Promise<Token> => {

            if ("undefined" === typeof idUser) {
                return Promise.reject(new Error("User not found"));
            }

            return Token.create({
                "idUser": idUser,
                "token": token,
                "fingerprint": fingerprint
            });

        }).then((): void => {

            return undefined;

        });

    }

    public removeToken (token: string): Promise<void> {

        return Token.destroy({
            "where": {
                "token": token
            }
        }).then((): void => {

            return undefined;

        });

    }

    public removeUser (name: string): Promise<void> {

        return User.destroy({
            "where": {
                "name": name
            }
        }).then((): void => {

            return undefined;

        });

    }

}
