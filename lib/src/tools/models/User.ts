// deps

    // externals
    import { DataTypes, Model } from "sequelize";

// types & interfaces

    // externals
    import type { Optional, Sequelize } from "sequelize";

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

// module

export default class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {

    public declare id: number;
    public declare name: string;
    public declare password: string;
    public declare isAdmin: boolean;
    public declare createdAt: Date;

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
        "indexes": [
            {
                "name": "idx_users_name",
                "unique": true,
                "fields": [ "name" ]
            }
        ]
    });

}
