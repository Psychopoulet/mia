// types & interfaces

    // externals
    import type { Request } from "express";
    import type ContainerPattern from "node-containerpattern";
    import type ConfManager from "node-confmanager";

// module

export default function getRequestPath (container: ContainerPattern, req: Request): string {

    return "[" + req.method + "]" + req.protocol + "://" + req.hostname + ":" + container.get<ConfManager>("conf").get<number>("port") + (req.path.length ? req.path : "");

}
