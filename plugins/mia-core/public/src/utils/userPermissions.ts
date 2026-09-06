// types & interfaces

    // locals
    import type { components } from "../Descriptor";

    type User = components["schemas"]["User"];

// module

export function canCreateUser (me: User): boolean {
    return me.isAdmin;
}

export function canEditUser (me: User, targetName: string): boolean {
    return me.isAdmin || me.name === targetName;
}

export function canDeleteUser (me: User, targetName: string): boolean {
    return me.isAdmin || me.name === targetName;
}

export function canManageUserTokens (me: User, targetName: string): boolean {
    return me.isAdmin || me.name === targetName;
}

export function canSetIsAdmin (me: User): boolean {
    return me.isAdmin;
}

export function canPurgeLogs (me: User): boolean {
    return me.isAdmin;
}
