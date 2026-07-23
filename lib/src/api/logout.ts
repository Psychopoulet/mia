// types & interfaces

    // locals
    import type { operations } from "./Descriptor";

// module

export default function logout (): Promise<operations["logout"]["responses"]["204"]["content"]["application/json"]> {

    return Promise.resolve();

}
