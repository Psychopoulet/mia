import { Model } from "sequelize";
import type { Optional, Sequelize } from "sequelize";
export interface TokenAttributes {
    "id": number;
    "idUser": number;
    "token": string;
    "fingerprint": string;
    "createdAt": Date;
}
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
export default class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {
    id: number;
    idUser: number;
    token: string;
    fingerprint: string;
    createdAt: Date;
    toPublic(): AuthTokenPublic;
    static getUserByToken(token: string): Promise<FullAuthPublic | undefined>;
    static getByUserName(name: string): Promise<AuthTokenPublic[]>;
}
export declare function registerToken(sequelize: Sequelize): void;
export {};
