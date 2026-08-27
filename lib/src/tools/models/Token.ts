// deps

    // externals
    import { DataTypes, Model } from "sequelize";

// types & interfaces

    // externals
    import type { Optional, Sequelize } from "sequelize";

    // locals
    import User from "./User";

    // row shape for auth tokens persisted in SQL
    export interface TokenAttributes {
        "id": number;
        "idUser": number;
        "token": string;
        "fingerprint": string;
        "createdAt": Date;
    }

    // id and createdAt are generated
    type TokenCreationAttributes = Optional<TokenAttributes, "id" | "createdAt">;

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

export default class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {

    public declare id: number;
    public declare idUser: number;
    public declare token: string;
    public declare fingerprint: string;
    public declare createdAt: Date;

    public toPublic (): AuthTokenPublic {

        return {
            "token": this.token,
            "fingerprint": this.fingerprint,
            "createdAt": toDate(this.createdAt)
        };

    }

    public static getUserByToken (token: string): Promise<FullAuthPublic | undefined> {

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

    public static getByUserName (name: string): Promise<AuthTokenPublic[]> {

        return User.findOne({
            "where": {
                "name": name
            },
            "attributes": [ "id" ]
        }).then((user: User | null): Promise<Token[]> => {

            if (!user) {
                return Promise.resolve([]);
            }

            return Token.findAll({
                "where": {
                    "idUser": user.id
                }
            });

        }).then((tokens: Token[]): AuthTokenPublic[] => {

            return tokens.map((token: Token): AuthTokenPublic => {

                return token.toPublic();

            });

        });

    }

}

export function registerToken (sequelize: Sequelize): void {

    Token.init({
        "id": {
            "type": DataTypes.INTEGER,
            "primaryKey": true,
            "autoIncrement": true
        },
        "idUser": {
            "type": DataTypes.INTEGER,
            "allowNull": false,
            "references": {
                "model": "users",
                "key": "id"
            },
            "onDelete": "CASCADE"
        },
        "token": {
            "type": DataTypes.TEXT,
            "allowNull": false
        },
        "fingerprint": {
            "type": DataTypes.TEXT,
            "allowNull": false
        },
        "createdAt": {
            "type": DataTypes.DATE,
            "allowNull": false,
            "defaultValue": DataTypes.NOW
        }
    }, {
        "sequelize": sequelize,
        "tableName": "tokens",
        "timestamps": true,
        "updatedAt": false,
        "indexes": [
            {
                "name": "idx_tokens_token",
                "unique": true,
                "fields": [ "token" ]
            },
            {
                "name": "idx_tokens_idUser",
                "fields": [ "idUser" ]
            }
        ]
    });

    // User must already be registered (registerUser before registerToken)
    User.hasMany(Token, {
        "foreignKey": "idUser",
        "onDelete": "CASCADE"
    });
    Token.belongsTo(User, {
        "foreignKey": "idUser"
    });

}
