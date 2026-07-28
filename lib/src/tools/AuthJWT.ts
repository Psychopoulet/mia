// deps

    // externals
    import jwt from "jsonwebtoken";

// types & interfaces

    // locals
    export interface AuthJWTDecoded {
        "name": string;
    }

// module

export function sign (name: string, key: string): Promise<string> {

    return new Promise((resolve:(result: string) => void, reject:(error: Error) => void): void => {

        jwt.sign({
            "name": name
        }, key, {
            "expiresIn": "7d"
        }, (err: Error | null, token: string | undefined): void => {

            if (err) {
                return reject(err);
            }
            else if ("undefined" === typeof token) {
                return reject(new Error("No token generated"));
            }

            return resolve(token);

        });

    });

}

export function verify (token: string, key: string): Promise<AuthJWTDecoded> {

    return new Promise((resolve:(result: AuthJWTDecoded) => void, reject:(error: Error) => void): void => {

        jwt.verify(token, key, (err: Error | null, decoded: string | jwt.JwtPayload | undefined): void => {

            if (err) {
                return reject(err);
            }

            else if ("undefined" === typeof decoded) {
                return reject(new Error("Invalid token"));
            }
            else if ("object" !== typeof decoded) {
                return reject(new Error("Invalid token"));
            }
            else if (null === decoded as unknown) { // had to force type to avoid lint error
                return reject(new Error("Invalid token"));
            }

                else if ("string" !== typeof decoded.name) {
                    return reject(new Error("Invalid token"));
                }
                else if (0 >= decoded.name.trim().length) {
                    return reject(new Error("Invalid token"));
                }

            return resolve(decoded as AuthJWTDecoded);

        });

    });

}
