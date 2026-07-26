// deps

    // natives
    import { createHash } from "node:crypto";

// module

export default function authCryptPassword (name: string, password: string, createdAt: Date): string {
    return createHash("sha256").update(name + password + createdAt.toISOString()).digest("hex");
}
