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

// module

export default class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {

    public declare id: number;
    public declare idUser: number;
    public declare token: string;
    public declare fingerprint: string;
    public declare createdAt: Date;

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
