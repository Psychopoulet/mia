/* eslint-disable consistent-return */
// - consistent-return is disabled because valid return values are not always explicitly returned

// deps

    // natives
    import { join } from "node:path";

    // externals
    import { readJSONFile, UnauthorizedError } from "node-pluginsmanager-plugin";

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

    interface iOperation {
        "security"?: unknown[];
    }

    interface iDescriptor {
        "paths"?: Record<string, Record<string, iOperation>>;
    }

    interface iRoute {
        "method": string;
        "path": RegExp;
    }

// consts

    const DESCRIPTOR_FILE: string = join(__dirname, "..", "..", "..", "plugins", "mia-core", "lib", "data", "Descriptor.json");

    const HTTP_METHODS: string[] = [
        "get",
        "put",
        "post",
        "delete",
        "options",
        "head",
        "patch",
        "trace"
    ];

// private

    // attributes

        let publicRoutes: Promise<iRoute[]> | null = null;

    // methods

        // transform a descriptor path into a matcher (ie "/mia-core/api/users/{name}" => /^\/mia-core\/api\/users\/[^/]+\/?$/)
        function _pathToRegExp (path: string): RegExp {

            const escaped: string = path.replace(/[.*+?^$()|[\]\\]/g, "\\$&");

            return new RegExp("^" + escaped.replace(/\{[^{}/]+\}/g, "[^/]+") + "/?$");

        }

        // every descriptor's operation without "security" flag is a public route
        function _extractPublicRoutes (): Promise<iRoute[]> {

            return readJSONFile(DESCRIPTOR_FILE).then((content: unknown): iRoute[] => {

                const paths: Record<string, Record<string, iOperation>> = (content as iDescriptor).paths ?? {};

                const routes: iRoute[] = [];

                Object.keys(paths).forEach((path: string): void => {

                    const operations: Record<string, iOperation> = paths[path];

                    Object.keys(operations).filter((method: string): boolean => {
                        return HTTP_METHODS.includes(method.toLowerCase());
                    }).forEach((method: string): void => {

                        const operation: iOperation = operations[method];

                        if (!Array.isArray(operation.security) || 0 >= operation.security.length) {

                            routes.push({
                                "method": method.toUpperCase(),
                                "path": _pathToRegExp(path)
                            });

                        }

                    });

                });

                return routes;

            });

        }

        // the descriptor is read only once, but a failed reading must not be registered
        function _getPublicRoutes (): Promise<iRoute[]> {

            publicRoutes ??= _extractPublicRoutes().catch((err: Error): Promise<iRoute[]> => {

                publicRoutes = null;

                return Promise.reject(err);

            });

            return publicRoutes;

        }

        function _isPublicRoute (routes: iRoute[], method: string, path: string): boolean {

            return routes.some((route: iRoute): boolean => {
                return route.method === method.toUpperCase() && route.path.test(path);
            });

        }

        function _checkToken (container: ContainerPattern, req: Request): Promise<void> {

            const token: string = extractToken(req);
            if (0 >= token.length) {
                throw new UnauthorizedError("No valid token provided");
            }

            return verify(token, container.get<ConfManager>("conf").get("auth-access-token")).then((): Promise<void> => {

                return Token.getUserByToken(token).then((authUser: FullAuthPublic | undefined): void => {

                    if (!authUser) {
                        throw new UnauthorizedError("This token is not valid anymore");
                    }

                });

            }).catch((err: Error): Promise<void> => {

                // if the token is expired, remove it from the database then return the initial error
                if (err.name && "TokenExpiredError" === err.name) {

                    return Token.destroy({
                        "where": {
                            "token": token
                        }
                    }).then((): Promise<void> => {
                        return Promise.reject(err);
                    }).catch((): Promise<void> => {
                        return Promise.reject(err);
                    });

                }

                return Promise.reject(err);

            });

        }

// module

export default function authorization (container: ContainerPattern, req: Request, res: Response, next: NextFunction): void {

    // public paths don't need authorization

    if (req.path.includes("/public/")) {
        return next();
    }

    // api paths not protected by a "security" flag in the descriptor don't need authorization

    _getPublicRoutes().then((routes: iRoute[]): Promise<void> => {

        if (_isPublicRoute(routes, req.method, req.path)) {
            return Promise.resolve();
        }

        return _checkToken(container, req);

    }).then((): void => {
        return next();
    }).catch((err: Error): void => {
        return next(err);
    });

}
