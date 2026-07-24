// deps

    // natives
    import { readFile } from "node:fs/promises";
    import { join } from "node:path";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";

    // locals
    interface iDescriptor {
        "info": {
            "title": string;
            "version": string;
            "description": string;
        };
    }

// module

export default function checkDescriptor (container: ContainerPattern): Promise<void> {

    return readFile(join(__dirname, "..", "..", "..", "data", "Descriptor.json"), "utf-8").then((content: string): iDescriptor => {
        return JSON.parse(content) as iDescriptor;
    }).then(({ info }: iDescriptor): void => {

            if (info.title !== container.get<string>("app.name")) {
                throw new Error("App name mismatch with Descriptor");
            }

            if (info.version !== container.get<string>("app.version")) {
                throw new Error("App version mismatch with Descriptor");
            }

            if (info.description !== container.get<string>("app.description")) {
                throw new Error("App description mismatch with Descriptor");
            }

    });

}
