// locals
import type { AuthTokenPublic, AuthUserPublic } from "../@types/AuthDatabase";
import type { components } from "../Descriptor";

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
        "isAdmin": user.isAdmin,
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
