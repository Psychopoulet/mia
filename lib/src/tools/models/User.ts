// deps

    // externals
    import bcrypt from "bcrypt";
    import { DataTypes, Model } from "sequelize";

    // locals
    import Token from "./Token";

// types & interfaces

    // externals
    import type { DestroyOptions, Optional, Sequelize, UpdateOptions } from "sequelize";

    // locals

    // row shape for auth users persisted in SQL
    export interface UserAttributes {
        "id": number;
        "name": string;
        "password": string;
        "isAdmin": boolean;
        "createdAt": Date;
    }

    // id and createdAt are generated; isAdmin defaults to false
    type UserCreationAttributes = Optional<UserAttributes, "id" | "isAdmin" | "createdAt">;

    export interface AuthUserPublic {
        "name": string;
        "isAdmin": boolean;
        "createdAt": Date;
    }

    type UserBulkUpdateOptions = UpdateOptions<UserAttributes> & {
        "attributes"?: Partial<UserAttributes>;
    };

// consts

    const BCRYPT_ROUNDS: number = 10;

// module

function toDate (value: Date | string): Date {

    return "string" === typeof value
        ? new Date(value)
        : value;

}

function isBcryptHash (value: string): boolean {

    return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);

}

function hashPassword (plain: string): Promise<string> {

    if (isBcryptHash(plain)) {
        return Promise.resolve(plain);
    }

    return bcrypt.hash(plain, BCRYPT_ROUNDS);

}

function destroyTokensByUserIds (idUsers: number[], transaction?: DestroyOptions<UserAttributes>["transaction"]): Promise<void> {

    if (0 === idUsers.length) {
        return Promise.resolve();
    }

    return Token.destroy({
        "where": {
            "idUser": idUsers
        },
        "transaction": transaction
    }).then((): void => {

        return undefined;

    });

}

export default class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {

    public declare id: number;
    public declare name: string;
    public declare password: string;
    public declare isAdmin: boolean;
    public declare createdAt: Date;

    public toPublic (): AuthUserPublic {

        return {
            "name": this.name,
            "isAdmin": Boolean(this.isAdmin),
            "createdAt": toDate(this.createdAt)
        };

    }

    public toJSON (): object {

        return {
            "id": this.id,
            "name": this.name,
            "isAdmin": Boolean(this.isAdmin),
            "createdAt": toDate(this.createdAt)
        };

    }

    public checkPassword (password: string): Promise<boolean> {

        return bcrypt.compare(password, this.password);

    }

    public static getByNameAndPassword (name: string, password: string): Promise<AuthUserPublic | undefined> {

        return User.unscoped().scope("withPassword").findOne({
            "where": {
                "name": name
            }
        }).then((user: User | null): Promise<AuthUserPublic | undefined> => {

            if (!user) {
                return Promise.resolve(undefined);
            }

            return user.checkPassword(password).then((isValid: boolean): AuthUserPublic | undefined => {

                return isValid
                    ? user.toPublic()
                    : undefined;

            });

        });

    }

}

function hashUserPassword (user: User): Promise<void> {

    return hashPassword(user.password).then((hash: string): void => {

        user.setDataValue("password", hash);

    });

}

export function registerUser (sequelize: Sequelize): void {

    User.init({
        "id": {
            "type": DataTypes.INTEGER,
            "primaryKey": true,
            "autoIncrement": true
        },
        "name": {
            "type": DataTypes.STRING,
            "allowNull": false
        },
        "password": {
            "type": DataTypes.TEXT,
            "allowNull": false
        },
        "isAdmin": {
            "type": DataTypes.BOOLEAN,
            "allowNull": false,
            "defaultValue": false
        },
        "createdAt": {
            "type": DataTypes.DATE,
            "allowNull": false,
            "defaultValue": DataTypes.NOW
        }
    }, {
        "sequelize": sequelize,
        "tableName": "users",
        "timestamps": true,
        "updatedAt": false,
        "defaultScope": {
            "attributes": {
                "exclude": [ "password" ]
            }
        },
        "scopes": {
            "withPassword": {
                "attributes": [
                    "id",
                    "name",
                    "password",
                    "isAdmin",
                    "createdAt"
                ]
            }
        },
        "hooks": {
            "beforeCreate" (user: User): Promise<void> {

                return hashUserPassword(user);

            },
            "beforeUpdate" (user: User): Promise<void> {

                if (!user.changed("password")) {
                    return Promise.resolve();
                }

                return hashUserPassword(user);

            },
            "beforeBulkCreate" (users: User[]): Promise<void> {

                return Promise.all(users.map(hashUserPassword)).then((): void => {

                    return undefined;

                });

            },
            "beforeBulkUpdate" (options: UpdateOptions<UserAttributes>): Promise<void> {

                const attributes: Partial<UserAttributes> | undefined = (options as UserBulkUpdateOptions).attributes;

                if (!attributes || !("password" in attributes)) {
                    return Promise.resolve();
                }

                const password: string | undefined = attributes.password;

                if ("undefined" === typeof password) {
                    return Promise.resolve();
                }

                return hashPassword(password).then((hash: string): void => {

                    attributes.password = hash;

                });

            },
            "beforeDestroy" (user: User, options: DestroyOptions<UserAttributes>): Promise<void> {

                // destroy tokens first: SQLite foreign_keys may be off
                return destroyTokensByUserIds([ user.id ], options.transaction);

            },
            "beforeBulkDestroy" (options: DestroyOptions<UserAttributes>): Promise<void> {

                return User.findAll({
                    "where": options.where,
                    "attributes": [ "id" ],
                    "transaction": options.transaction
                }).then((users: User[]): Promise<void> => {

                    return destroyTokensByUserIds(users.map((user: User): number => {
                        return user.id;
                    }), options.transaction);

                });

            }
        },
        "indexes": [
            {
                "name": "idx_users_name",
                "unique": true,
                "fields": [ "name" ]
            }
        ]
    });

}
