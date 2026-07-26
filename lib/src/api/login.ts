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

    const authDb = container.get<AuthDatabase>("auth-db");

    authDb.getUserByNameAndPassword(body.name, body.password).then((user: AuthUser | undefined): Promise<string> => {

        if (!user) {
            throw new NotFoundError("Invalid credentials");
        }

        return sign(body.name, container.get<string>("server-key")).then((token: string): Promise<string> => {

            return authDb.addToken(user.id, token, req.headers["user-agent"] ?? "No user agent").then((): string => {
                return token;
            });

        });

    }).then((token: string): void => {
        res.status(201).json(token);
    }).catch((error: Error): void => {
        return next(error);
    });

}
