/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

    // locals
    import { sign } from "../tools/AuthJWT";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { operations } from "./Descriptor";
    import type AuthDatabase from "../tools/AuthDatabase";
    import type { AuthUser } from "../tools/AuthDatabase";

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

    const authDb = container.get<AuthDatabase>("auth-db");

    authDb.getUserByNameAndPassword(body.name, body.password).then((user: AuthUser | undefined): Promise<string> => {

        if (!user) {
            throw new NotFoundError("Invalid credentials");
        }

        return sign(body.name, body.password, new Date(user.createdAt), container.get<string>("server-key")).then((token: string): Promise<string> => {

            return authDb.addToken(user.id, token).then((): string => {
                return token;
            });

        });

    }).then((token: string): void => {
        res.status(201).json(token);
    }).catch((error: Error): void => {
        return next(error);
    });

}
