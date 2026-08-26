// deps

    // locals
    import extractToken from "../tools/extractToken";
    import Token from "../tools/models/Token";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function logout (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // no control needed because it's already done in the authentication middleware
    const token: string = extractToken(req);

    Token.destroy({
        "where": {
            "token": token
        }
    }).then((): void => {

        const httpCode: keyof operations["logout"]["responses"] = 204;

        res.status(httpCode).json();

    }).catch((error: Error): void => {
        return next(error);
    });

}
