/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

    // locals
    import { sign } from "../tools/AuthJWT";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";

    // locals
    import type { operations } from "./Descriptor";
    import type AuthDatabase from "../tools/AuthDatabase";
    import type { AuthUser } from "../tools/AuthDatabase";

// module

export default function login (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const body: operations["login"]["requestBody"]["content"]["application/json"] = req.body as operations["login"]["requestBody"]["content"]["application/json"];

    const authDb = container.get<AuthDatabase>("auth-db");

    authDb.getUserByNameAndPassword(body.name, body.password).then((user: AuthUser | undefined): Promise<string> => {

        if (!user) {
            throw new NotFoundError("Invalid credentials");
        }

        return sign(body.name, container.get<ConfManager>("conf").get("auth-access-token")).then((token: string): Promise<string> => {

            return authDb.addToken(user.id, token, req.headers["user-agent"] ?? "No user agent").then((): string => {
                return token;
            });

        });

    }).then((data: operations["login"]["responses"]["201"]["content"]["application/json"]): void => {

        const httpCode: keyof operations["login"]["responses"] = 201;

        res.status(httpCode).json(data);

    }).catch((error: Error): void => {
        return next(error);
    });

}
