/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

    // locals
    import { verify } from "../tools/AuthJWT";
    import extractToken from "../tools/extractToken";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type AuthDatabase from "../tools/AuthDatabase";
    import type { FullAuth } from "../tools/AuthDatabase";

// module

export default function authorization (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // public paths don't need authorization
    // auth paths must be usable without authorization

    if (!req.path.includes("/api/")) {
        return next();
    }
    else if (req.path.includes("/api/auth") && "PUT" === req.method) { // login path doesn't need authorization
        return next();
    }

    // api paths need authorization

    const token: string = extractToken(req);
    if (0 >= token.length) {
        return next(new UnauthorizedError("No valid token provided"));
    }

    verify(token, container.get<string>("server-key")).then((): Promise<void> => {

        const authDb = container.get<AuthDatabase>("auth-db");

        return authDb.getUserByToken(token).then((authUser: FullAuth | undefined): void => {

            if (!authUser) {
                throw new UnauthorizedError("This token is not valid anymore");
            }

        });

    }).then((): void => {
        return next();
    }).catch((err: Error): void => {
        return next(err);
    });

}
