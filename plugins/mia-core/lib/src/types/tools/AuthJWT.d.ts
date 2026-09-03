export interface AuthJWTDecoded {
    "name": string;
}
export declare function sign(name: string, key: string): Promise<string>;
export declare function verify(token: string, key: string): Promise<AuthJWTDecoded>;
