/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import jwt from "jsonwebtoken";
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";

    // locals
    import type Auth from "../tools/Auth";
    import type { AuthUser, FullAuth } from "../tools/Auth";

// module

export default function authorization (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // public paths don't need authorization
    // auth paths must be usable without authorization

    if (!req.path.includes("/api/") || req.path.startsWith("/api/auth")) {
        return next();
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

        return next(new UnauthorizedError("No valid token provided"));

    }

    console.log("authorization found, checking...");

    new Promise((resolve: (user: AuthUser) => void, reject: (err: Error) => void): void => {

        jwt.verify(token, container.get<string>("server-key"), (err: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined): void => {

            if (err) {
                console.log("authorization error", err);
                return reject(err);
            }

            console.log("authorization decoded", decoded);

            if ("undefined" === typeof decoded) {
                return reject(new UnauthorizedError("Invalid token provided"));
            }
            else if ("object" !== typeof decoded) {
                return reject(new UnauthorizedError("Invalid token provided"));
            }
            else if (null === decoded as unknown) { // had to force type to avoid lint error
                return reject(new UnauthorizedError("Invalid token provided"));
            }
                else if ("string" !== typeof decoded.name) {
                    return reject(new UnauthorizedError("Invalid token provided"));
                }
                else if (0 >= decoded.name.trim().length) {
                    return reject(new UnauthorizedError("Invalid token provided"));
                }
                else if ("string" !== typeof decoded.password) {
                    return reject(new UnauthorizedError("Invalid token provided"));
                }
                else if (0 >= decoded.password.trim().length) {
                    return reject(new UnauthorizedError("Invalid token provided"));
                }

            return resolve(decoded as AuthUser);

        });

    }).then((tokenUserData: AuthUser): Promise<void> => {

        return container.get<Auth>("auth-db").getUserByToken(token).then((authUser: FullAuth | undefined): void => {

            if (!authUser) {
                console.log("authorization user not found in database for this token");
                return next(new UnauthorizedError("This token is not valid anymore"));
            }

            if (!container.get<Auth>("auth-db").comparePassword(tokenUserData.password, authUser.password)) {
                console.log("authorization user password does not match");
                return next(new UnauthorizedError("This token is not valid anymore"));
            }

            console.log("authorization user", {
                "name": authUser.name,
                "password": authUser.password
            });

            console.log("database user", {
                "name": tokenUserData.name,
                "password": tokenUserData.password
            });

        });

    }).then((): void => {
        return next();
    }).catch((err: Error): void => {
        return next(err);
    });

}
