// deps

    // externals
    import jwt from "jsonwebtoken";
    import { formateError, UnauthorizedError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

// module

export default function authorization (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // public paths don't need authorization
    // auth paths must be usable without authorization

    if (!req.path.includes("/api/") || req.path.startsWith("/api/auth/")) {
        next();
        return;
    }

    // api paths need authorization

    console.log("api requested");

    let headerAuthorization: string = "";
    if ("undefined" === typeof req.headers.Authorization) {
        headerAuthorization = "";
    }
    else if ("string" === typeof req.headers.Authorization) {
        headerAuthorization = req.headers.Authorization;
    }
    else if (Array.isArray(req.headers.Authorization)) {
        headerAuthorization = req.headers.Authorization[0];
    }

    const token: string | undefined = headerAuthorization.split(" ")[1] ?? undefined;

    if ("undefined" === typeof token) {

        console.log("authorization not found");

        const error = formateError(new UnauthorizedError("No valid token provided"));

        res.status(error.httpCode).json({
            "code": error.code,
            "message": error.message
        });

        return;

    }

    console.log("authorization found, checking...");

    jwt.verify(token, container.get<string>("server-key"), (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined): void => {

        if (err) {

            console.log("authorization error", err);

            const error = formateError(new UnauthorizedError("Invalid token provided"));

            res.status(error.httpCode).json({
                "code": error.code,
                "message": error.message
            });

            return;

        }

        console.log("authorization decoded", decoded);

        next();

    });

}
