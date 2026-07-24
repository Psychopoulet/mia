/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import jwt from "jsonwebtoken";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function login (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const body: operations["login"]["requestBody"]["content"]["application/json"] = req.body as operations["login"]["requestBody"]["content"]["application/json"];

    if ("undefined" === typeof body) {
        return next(new ReferenceError("Missing body"));
    }
    else if ("object" !== typeof body) {
        return next(new TypeError("Body is not an object"));
    }
    else if (null === body as unknown) { // had to force type to avoid lint error
        return next(new ReferenceError("Body is null"));
    }
        else if ("undefined" === typeof body.origin) {
            return next(new ReferenceError("Missing \"origin\" in body"));
        }
        else if ("string" !== typeof body.origin) {
            return next(new TypeError("\"origin\" in body is not a string"));
        }
        else if (0 >= body.origin.trim().length) {
            return next(new RangeError("\"origin\" in body is empty"));
        }

    jwt.sign({
        "origin": body.origin
    }, container.get<string>("server-key"), {
        "expiresIn": "7d"
    }, (err: Error | null, token: string | undefined): void => {

        if (err) {
            return next(err);
        }
        else if ("undefined" === typeof token) {
            return next(new Error("No token generated"));
        }

        res.status(201).json(token);

    });

}
