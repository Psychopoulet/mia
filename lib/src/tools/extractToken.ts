// types & interfaces

    // externals
    import type { Request } from "express";

// module

export default function extractToken (req: Request): string {

    let headerAuthorization: string = "";

    const header: string | undefined = Object.keys(req.headers).find((key: string): boolean => {
        return "authorization" === key.toLowerCase();
    });

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

    return headerAuthorization.replace("Bearer ", "").trim();

}
