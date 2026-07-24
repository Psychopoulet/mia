// deps

    // natives
    import { createHash } from "node:crypto";

// module

export default function authCryptPassword (password: string): string {
    return createHash("sha256").update(password).digest("hex");
}
