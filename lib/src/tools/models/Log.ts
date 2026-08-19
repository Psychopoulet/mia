// deps

    // externals
    import { DataTypes, Model } from "sequelize";

// types & interfaces

    // externals
    import type { Optional, Sequelize } from "sequelize";

    // locals

    // row shape for Winston logs persisted in SQL
    export interface LogAttributes {
        "id": number;
        "level": string; // Winston level name (critical, error, warning, success, info, debug)
        "message": string;
        "timestamp": Date;
        "meta": object | null; // extra Winston fields, optional
    }

    // id is auto-incremented; meta may be omitted on insert
    type LogCreationAttributes = Optional<LogAttributes, "id" | "meta">;

// module

export default class Log extends Model<LogAttributes, LogCreationAttributes> implements LogAttributes {

    public declare id: number;
    public declare level: string;
    public declare message: string;
    public declare timestamp: Date;
    public declare meta: object | null;

}

export function registerLog (sequelize: Sequelize): void {

    Log.init({
        "id": {
            "type": DataTypes.INTEGER,
            "primaryKey": true,
            "autoIncrement": true
        },
        "level": {
            "type": DataTypes.STRING,
            "allowNull": false
        },
        "message": {
            "type": DataTypes.TEXT,
            "allowNull": false
        },
        "timestamp": {
            "type": DataTypes.DATE,
            "allowNull": false
        },
        "meta": {
            "type": DataTypes.JSON,
            "allowNull": true
        }
    }, {
        "sequelize": sequelize,
        "tableName": "logs",
        "timestamps": false // keep Winston's timestamp, not Sequelize createdAt/updatedAt
    });

}
