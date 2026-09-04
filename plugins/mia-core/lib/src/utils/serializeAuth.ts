// locals
import type { AuthTokenPublic } from "../types/tools/models/Token";
import type { components } from "../Descriptor";

// public shape of a host User row (password excluded by the model default scope)
export interface AuthUserPublic {
    "name": string;
    "isAdmin": boolean;
    "createdAt": Date | string;
}

// module

export function toIsoDate (value: Date | string): string {

    if (value instanceof Date) {
        return value.toISOString();
    }

    const parsed: Date = new Date(value);

    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();

}

export function serializeUser (user: AuthUserPublic): components["schemas"]["User"] {

    return {
        "name": user.name,
        "isAdmin": Boolean(user.isAdmin), // sqlite stores booleans as 0 / 1
        "createdAt": toIsoDate(user.createdAt)
    };

}

export function serializeToken (token: AuthTokenPublic): {
    "token": string;
    "fingerprint": string;
    "createdAt": string;
} {

    return {
        "token": token.token,
        "fingerprint": token.fingerprint,
        "createdAt": toIsoDate(token.createdAt)
    };

}
