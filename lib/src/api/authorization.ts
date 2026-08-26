/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

    // locals
    import { verify } from "../tools/AuthJWT";
    import extractToken from "../tools/extractToken";
    import Token from "../tools/models/Token";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";

    // locals
    import type { FullAuthPublic } from "../tools/models/Token";

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

    verify(token, container.get<ConfManager>("conf").get("auth-access-token")).then((): Promise<void> => {

        return Token.getUserByToken(token).then((authUser: FullAuthPublic | undefined): void => {

            if (!authUser) {
                throw new UnauthorizedError("This token is not valid anymore");
            }

        });

    }).then((): void => {
        return next();
    }).catch((err: Error): void => {

        // if the token is expired, remove it from the database then return the initial error
        if (err.name && "TokenExpiredError" === err.name) {

            Token.destroy({
                "where": {
                    "token": token
                }
            }).then((): void => {
                return next(err);
            }).catch((): void => {
                return next(err);
            });

            return;

        }

        return next(err);

    });

}
