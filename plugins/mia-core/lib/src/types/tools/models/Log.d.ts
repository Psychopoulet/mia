import { Model } from "sequelize";
import type { Optional, Sequelize } from "sequelize";
export interface LogAttributes {
    "id": number;
    "level": string;
    "message": string;
    "timestamp": Date;
    "meta": object | null;
}
type LogCreationAttributes = Optional<LogAttributes, "id" | "meta">;
export default class Log extends Model<LogAttributes, LogCreationAttributes> implements LogAttributes {
    id: number;
    level: string;
    message: string;
    timestamp: Date;
    meta: object | null;
    static countInRange(from: Date, to: Date, level?: string): Promise<number>;
    static findInRange(from: Date, to: Date, level?: string, limit?: number): Promise<Log[]>;
    static destroyInRange(from: Date, to: Date): Promise<number>;
}
export declare function registerLog(sequelize: Sequelize): void;
export {};
