// types & interfaces

    // externals
    import type { iUrlAllowedParameters } from "node-pluginsmanager-plugin";

// module

export default function getFingerprint (headers: iUrlAllowedParameters["headers"]): string {

    const userAgent: unknown = headers?.["user-agent"];

    if ("string" === typeof userAgent) {
        return userAgent;
    }

    if (!Array.isArray(userAgent) || 0 >= userAgent.length) {
        return "No user agent";
    }

    const value: unknown = userAgent.find((item: unknown): boolean => {
        return "string" === typeof item;
    });

    return "string" === typeof value
        ? value
        : "No user agent";

}
