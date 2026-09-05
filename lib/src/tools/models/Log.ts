// deps

    // externals
    import { DataTypes, Model, Op } from "sequelize";

// types & interfaces

    // externals
    import type { Optional, Sequelize, WhereOptions } from "sequelize";

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

function rangeWhere (from: Date, to: Date): WhereOptions<LogAttributes> {

    return {
        "timestamp": {
            [Op.gte]: from,
            [Op.lte]: to
        }
    };

}

export default class Log extends Model<LogAttributes, LogCreationAttributes> implements LogAttributes {

    public declare id: number;
    public declare level: string;
    public declare message: string;
    public declare timestamp: Date;
    public declare meta: object | null;

    // keep Op inside the model: plugins must not depend on sequelize at runtime
    public static findInRange (from: Date, to: Date, level?: string): Promise<Log[]> {

        const where: WhereOptions<LogAttributes> = "string" === typeof level && "" !== level
            ? { ...rangeWhere(from, to), "level": level }
            : rangeWhere(from, to);

        return Log.findAll({
            "where": where,
            "order": [
                [ "timestamp", "ASC" ],
                [ "id", "ASC" ]
            ]
        });

    }

    public static destroyInRange (from: Date, to: Date): Promise<number> {

        return Log.destroy({
            "where": rangeWhere(from, to)
        });

    }

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
