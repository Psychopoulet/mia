// deps

    // externals
    import bcrypt from "bcrypt";

// types & interfaces

    // locals
    import User from "./models/User";
    import Token from "./models/Token";

    export interface AuthUserPublic {
        "name": string;
        "isAdmin": boolean;
        "createdAt": Date;
    }

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

// consts

    const BCRYPT_ROUNDS: number = 10;

// module

function toDate (value: Date | string): Date {

    return "string" === typeof value
        ? new Date(value)
        : value;

}

function toAuthUserPublic (user: User): AuthUserPublic {

    return {
        "name": user.name,
        "isAdmin": Boolean(user.isAdmin),
        "createdAt": toDate(user.createdAt)
    };

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

        return bcrypt.hash(password, BCRYPT_ROUNDS).then((hash: string): Promise<User> => {

            return User.create({
                "name": name,
                "password": hash,
                "isAdmin": isAdmin
            });

        }).then((): void => {

            return undefined;

        });

    }

    public editUserPassword (name: string, password: string): Promise<void> {

        return bcrypt.hash(password, BCRYPT_ROUNDS).then((hash: string): Promise<[affectedCount: number]> => {

            return User.update({
                "password": hash
            }, {
                "where": {
                    "name": name
                }
            });

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

        return User.findOne({
            "where": {
                "name": name
            }
        }).then((user: User | null): Promise<AuthUserPublic | undefined> => {

            if (!user) {
                return Promise.resolve(undefined);
            }

            return bcrypt.compare(password, user.password).then((isValid: boolean): AuthUserPublic | undefined => {

                return isValid
                    ? toAuthUserPublic(user)
                    : undefined;

            });

        });

    }

    public getUserByName (name: string): Promise<AuthUserPublic | undefined> {

        return User.findOne({
            "where": {
                "name": name
            }
        }).then((user: User | null): AuthUserPublic | undefined => {

            return user
                ? toAuthUserPublic(user)
                : undefined;

        });

    }

    public getUsers (): Promise<AuthUserPublic[]> {

        return User.findAll({
            "order": [ [ "name", "ASC" ] ]
        }).then((users: User[]): AuthUserPublic[] => {

            return users.map(toAuthUserPublic);

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

        return this._getUserIdByName(name).then((idUser: number | undefined): Promise<number> => {

            if ("undefined" === typeof idUser) {
                return Promise.resolve(0);
            }

            // destroy tokens first: SQLite foreign_keys may be off
            return Token.destroy({
                "where": {
                    "idUser": idUser
                }
            }).then((): Promise<number> => {

                return User.destroy({
                    "where": {
                        "id": idUser
                    }
                });

            });

        }).then((): void => {

            return undefined;

        });

    }

}
