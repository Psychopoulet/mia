// deps

    // externals
    import jwt from "jsonwebtoken";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function login (
    container: ContainerPattern,
    body: operations["login"]["requestBody"]["content"]["application/json"]
): Promise<operations["login"]["responses"]["201"]["content"]["application/json"]> {

    return new Promise((resolve: (value: operations["login"]["responses"]["201"]["content"]["application/json"]) => void, reject: (reason: Error) => void): void => {

        jwt.sign({
            "origin": body.origin
        }, container.get<string>("server-key"), {
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
