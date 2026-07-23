// deps

    // externals
    import { formateError, UnauthorizedError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";

// module

export default function authentication (req: Request, res: Response, next: NextFunction): void {

    // api paths need authentication

    if (req.path.includes("/api/")) {

        console.log("api requested");

        if ("string" !== typeof req.headers.Authentication || "" === req.headers.Authentication) {

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

    // public paths don't need authentication, but html pages need to be redirected to the login page

    else if ("/" === req.path || (req.path.includes("/public/") && req.path.endsWith(".html"))) {

        // @TODO: check session

        console.log("html page requested, redirecting to login");

        res.redirect(301, "/auth/login");

        return;

    }

    // other paths (libs, css, js, etc.) don't need authentication

    next();

}
