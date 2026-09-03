import { Model } from "sequelize";
import type { Optional, Sequelize } from "sequelize";
export interface UserAttributes {
    "id": number;
    "name": string;
    "password": string;
    "isAdmin": boolean;
    "createdAt": Date;
}
type UserCreationAttributes = Optional<UserAttributes, "id" | "isAdmin" | "createdAt">;
export default class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    name: string;
    password: string;
    isAdmin: boolean;
    createdAt: Date;
    toJSON(): object;
    checkPassword(password: string): Promise<boolean>;
    static getByNameAndPassword(name: string, password: string): Promise<UserAttributes | undefined>;
}
export declare function registerUser(sequelize: Sequelize): void;
export {};
