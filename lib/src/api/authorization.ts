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

    if (!req.path.includes("/api/") || req.path.startsWith("/api/auth")) {
        next();
        return;
    }

    // api paths need authorization

    console.log("api requested", req.headers);

    let headerAuthorization: string = "";

    const header: string | undefined = Object.keys(req.headers).find((key: string): boolean => {
        return "authorization" === key.toLowerCase();
    });

    console.log("header", header);

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

    console.log("headerAuthorization", headerAuthorization);

    const token: string = headerAuthorization.replace("Bearer ", "").trim();

    console.log("token", token);

    if (0 >= token.length) {

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
