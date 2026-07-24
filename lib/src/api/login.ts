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
        else if ("undefined" === typeof body.name) {
            return next(new ReferenceError("Missing \"name\" in body"));
        }
        else if ("string" !== typeof body.name) {
            return next(new TypeError("\"name\" in body is not a string"));
        }
        else if (0 >= body.name.trim().length) {
            return next(new RangeError("\"name\" in body is empty"));
        }
        else if ("undefined" === typeof body.password) {
            return next(new ReferenceError("Missing \"password\" in body"));
        }
        else if ("string" !== typeof body.password) {
            return next(new TypeError("\"password\" in body is not a string"));
        }
        else if (0 >= body.password.trim().length) {
            return next(new RangeError("\"password\" in body is empty"));
        }

    jwt.sign({
        "name": body.name,
        "password": body.password
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
