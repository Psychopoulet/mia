/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

    // locals
    import { verify } from "../tools/AuthJWT";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type AuthDatabase from "../tools/AuthDatabase";
    import type { FullAuth } from "../tools/AuthDatabase";
    import type { AuthJWTDecoded } from "../tools/AuthJWT";

// module

export default function authorization (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // public paths don't need authorization
    // auth paths must be usable without authorization

    if (!req.path.includes("/api/") || req.path.startsWith("/api/auth")) {
        return next();
    }

    // api paths need authorization

    let headerAuthorization: string = "";

    const header: string | undefined = Object.keys(req.headers).find((key: string): boolean => {
        return "authorization" === key.toLowerCase();
    });

    if ("string" === typeof header) {

        if ("undefined" === typeof req.headers[header]) {
            headerAuthorization = "";
        }
        else if ("string" === typeof req.headers[header]) {
            headerAuthorization = req.headers[header];
        }
        else if (Array.isArray(req.headers[header]) && 0 < req.headers[header].length) {
            headerAuthorization = req.headers[header][0];
        }

    }

    const token: string = headerAuthorization.replace("Bearer ", "").trim();

    if (0 >= token.length) {
        return next(new UnauthorizedError("No valid token provided"));
    }

    verify(token, container.get<string>("server-key")).then((tokenUserData: AuthJWTDecoded): Promise<void> => {

        const authDb = container.get<AuthDatabase>("auth-db");

        return authDb.getUserByToken(token).then((authUser: FullAuth | undefined): void => {

            if (!authUser) {
                return next(new UnauthorizedError("This token is not valid anymore"));
            }

            if (tokenUserData.password !== authUser.password) {
                return next(new UnauthorizedError("This token is not valid anymore"));
            }

        });

    }).then((): void => {
        return next();
    }).catch((err: Error): void => {
        return next(err);
    });

}
