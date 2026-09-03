// types & interfaces

    // locals
    import type { AuthTokenPublic as HostAuthTokenPublic, FullAuthPublic } from "../types/tools/models/Token";

export type { FullAuthPublic };

export interface AuthUserPublic {
    "name": string;
    "isAdmin": boolean;
    "createdAt": Date | string;
}

export interface AuthTokenPublic extends Omit<HostAuthTokenPublic, "createdAt"> {
    "createdAt": Date | string;
}

/**
 * Public surface of mia AuthDatabase (Container key "auth-db").
 * Runtime instance is provided by the MIA host; this interface types Container.get("auth-db").
 */
export interface AuthDatabase {
    "addUser": (name: string, password: string, isAdmin?: boolean) => Promise<void>;
    "editUserPassword": (name: string, password: string) => Promise<void>;
    "editUserIsAdmin": (name: string, isAdmin: boolean) => Promise<void>;
    "getUserByToken": (token: string) => Promise<FullAuthPublic | undefined>;
    "getUserByName": (name: string) => Promise<AuthUserPublic | undefined>;
    "getUsers": () => Promise<AuthUserPublic[]>;
    "getTokensByUserName": (name: string) => Promise<AuthTokenPublic[]>;
    "removeToken": (token: string) => Promise<void>;
    "removeUser": (name: string) => Promise<void>;
}
