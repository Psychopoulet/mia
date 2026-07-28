// deps

    // natives
    import { join } from "node:path";

    // externals
    import SwaggerParser from "@apidevtools/swagger-parser";

// types & interfaces

    // externals
    import type { Request, Response, NextFunction } from "express";

    // locals
    import type { operations } from "./Descriptor";

// module

export default function getDescriptor (req: Request, res: Response, next: NextFunction): void {

    const descriptorFile: string = join(__dirname, "..", "..", "data", "Descriptor.json");

    // generate descriptor (bundle + validate, same pattern as node-pluginsmanager-plugin Orchestrator)
    SwaggerParser.bundle(descriptorFile).then((bundledDescriptor): Promise<Response> => {

        // force validate because of stupid malformatted references
        return SwaggerParser.validate(bundledDescriptor).then((validatedDescriptor): Response => {

            const descriptor = validatedDescriptor as {
                "servers"?: unknown[];
            };

            descriptor.servers ??= [];

            return res.status(200).json(descriptor);

        });

    }).then((data): Response => {

        const httpCode: keyof operations["getDescriptor"]["responses"] = 200;

        return res.status(httpCode).json(data);

    }).catch((err: Error): void => {
        return next(err);
    });

}
