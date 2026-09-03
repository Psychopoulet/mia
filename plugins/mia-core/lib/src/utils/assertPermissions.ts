// deps

    // externals
    import { UnauthorizedError } from "node-pluginsmanager-plugin";

    // locals
    import type { FullAuthPublic } from "../@types/AuthDatabase";

// module

export function assertAdmin (caller: FullAuthPublic): void {

    if (!caller.isAdmin) {
        throw new UnauthorizedError("Admin privileges required");
    }

}

export function assertSelfOrAdmin (caller: FullAuthPublic, name: string): void {

    if (!caller.isAdmin && caller.name !== name) {
        throw new UnauthorizedError("Forbidden");
    }

}
