/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // locals
    import extractToken from "../tools/extractToken";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type AuthDatabase from "../tools/AuthDatabase";

// module

export default function logout (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // no control needed because it's already done in the authentication middleware
    const token: string = extractToken(req);

    const authDb = container.get<AuthDatabase>("auth-db");
    authDb.removeToken(token).then((): void => {
        res.status(204).json();
    }).catch((error: Error): void => {
        return next(error);
    });

}
