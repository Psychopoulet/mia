// deps

    // externals
    import { formateError, UnauthorizedError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";

// module

export default function authentication (req: Request, res: Response, next: NextFunction): void {

    // api paths need authentication

    if (req.path.includes("/api/") && !req.path.startsWith("/api/auth/")) {

        console.log("api requested");

        if ("string" !== typeof req.headers.Authentication || "" === req.headers.Authentication) {

            console.log("authentication not found");

            const error = formateError(new UnauthorizedError("Not authorized"));

            res.status(error.httpCode).json({
                "code": error.code,
                "message": error.message
            });

            return;

        }

        console.log("authentication found, checking...");

        // @TODO: check authentication

        const error = formateError(new UnauthorizedError("Not authorized"));

        res.status(error.httpCode).json({
            "code": error.code,
            "message": error.message
        });

        return;

    }

    // public paths don't need authentication

    next();

}
