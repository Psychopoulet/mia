// module

interface AuthTokenPayload {
    "name"?: unknown;
}

function padBase64 (value: string): string {

    const remainder: number = value.length % 4;
    const padLength: number = 0 === remainder ? 0 : 4 - remainder;

    return value + "=".repeat(padLength);

}

/**
 * Reads the JWT payload `name` claim from a MIA auth token (no signature verify —
 * the host already authenticated the request; this only identifies the caller for UI gates).
 */
export default function decodeAuthTokenName (token: string): string | null {

    const parts: string[] = token.split(".");

    if (2 > parts.length || !parts[1]) {
        return null;
    }

    try {

        const normalized: string = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload: AuthTokenPayload = JSON.parse(atob(padBase64(normalized))) as AuthTokenPayload;

        return "string" === typeof payload.name ? payload.name : null;

    }
    catch {

        return null;

    }

}
