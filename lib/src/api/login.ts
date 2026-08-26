// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

    // locals
    import { sign } from "../tools/AuthJWT";
    import User from "../tools/models/User";
    import Token from "../tools/models/Token";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";

    // locals
    import type { operations } from "./Descriptor";
    import type { UserAttributes } from "../tools/models/User";

// module

export default function login (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    const body: operations["login"]["requestBody"]["content"]["application/json"] = req.body as operations["login"]["requestBody"]["content"]["application/json"];

    User.getByNameAndPassword(body.name, body.password).then((user: UserAttributes | undefined): Promise<string> => {

        if (!user) {
            throw new NotFoundError("Invalid credentials");
        }

        return sign(body.name, container.get<ConfManager>("conf").get("auth-access-token")).then((token: string): Promise<string> => {

            return Token.create({
                "idUser": user.id,
                "token": token,
                "fingerprint": req.headers["user-agent"] ?? "No user agent"
            }).then((): string => {
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
