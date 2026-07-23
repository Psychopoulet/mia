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

    if ("undefined" === typeof body) {
        return Promise.reject(new ReferenceError("Missing body"));
    }
    else if ("object" !== typeof body) {
        return Promise.reject(new TypeError("Body is not an object"));
    }
    else if (null === body as unknown) { // had to force type to avoid lint error
        return Promise.reject(new ReferenceError("Body is null"));
    }
        else if ("undefined" === typeof body.origin) {
            return Promise.reject(new ReferenceError("Missing \"origin\" in body"));
        }
        else if ("string" !== typeof body.origin) {
            return Promise.reject(new TypeError("\"origin\" in body is not a string"));
        }
        else if (0 >= body.origin.trim().length) {
            return Promise.reject(new RangeError("\"origin\" in body is empty"));
        }

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
