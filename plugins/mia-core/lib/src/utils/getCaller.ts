// deps

    // externals
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

    // locals
    import type { FullAuthPublic } from "../types/tools/models/Token";

// types & interfaces

export interface iUrlWithHeaders {
    "headers"?: Record<string, unknown>;
    "header"?: Record<string, unknown>;
}

// module

function _headerValue (value: unknown): string | null {

    if ("string" === typeof value) {
        return value;
    }

    if (Array.isArray(value) && "string" === typeof value[0]) {
        return value[0];
    }

    return null;

}

function _readHeader (urlParameters: iUrlWithHeaders, name: string): string | null {

    const fromHeader: Record<string, unknown> = urlParameters.header ?? {};
    const fromHeaders: Record<string, unknown> = urlParameters.headers ?? {};
    const headers: Record<string, unknown> = { ...fromHeader, ...fromHeaders };
    const key: string | undefined = Object.keys(headers).find((k: string): boolean => {
        return k.toLowerCase() === name.toLowerCase();
    });

    return "undefined" === typeof key ? null : _headerValue(headers[key]);

}

/**
 * Resolve the current user from the Bearer token for **authorization** (self/admin).
 * Authentication itself is enforced by the MIA host middleware; this only maps token → user.
 */
export default function getCaller (
    getUserByToken: (token: string) => Promise<FullAuthPublic | undefined>,
    urlParameters: iUrlWithHeaders
): Promise<FullAuthPublic> {

    const authorization: string | null = _readHeader(urlParameters, "authorization");

    if ("string" !== typeof authorization || "" === authorization) {
        throw new UnauthorizedError("Missing Authorization header");
    }

    const match: RegExpMatchArray | null = (/^Bearer\s+(.+)$/i).exec(authorization.trim());
    const tokenFromHeader: string | undefined = match?.[1];

    if ("string" !== typeof tokenFromHeader || "" === tokenFromHeader) {
        throw new UnauthorizedError("Invalid Authorization header");
    }

    return getUserByToken(tokenFromHeader.trim()).then((user: FullAuthPublic | undefined): FullAuthPublic => {

        if (!user) {
            throw new UnauthorizedError("Invalid token");
        }

        return user;

    });

}
