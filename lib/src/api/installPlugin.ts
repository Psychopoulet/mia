// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";

    // locals
    import type { operations } from "./Descriptor";

    interface iGithubRepository {
        "user": string;
        "repo": string;
    }

// private

    function _parseGithubPath (github: string): iGithubRepository {

        const path: string = github.trim().replace(/\.git$/u, "");
        const urlMatch: RegExpExecArray | null = /github\.com[/:]([^/]+)\/([^/]+)/u.exec(path);
        const shortMatch: RegExpExecArray | null = /^github:([^/]+)\/([^/]+)$/u.exec(path);
        const match: RegExpExecArray | null = urlMatch ?? shortMatch;

        if (match) {

            return {
                "user": match[1],
                "repo": match[2]
            };

        }

        const parts: string[] = path.split("/").filter(Boolean);

        if (2 <= parts.length) {

            return {
                "user": parts[parts.length - 2],
                "repo": parts[parts.length - 1]
            };

        }

        throw new Error("Invalid GitHub repository path");

    }

// module

export default function installPlugin (container: ContainerPattern, body: operations["installPluginFromGithub"]["requestBody"]["content"]["application/json"]): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> {

    if ("undefined" === typeof body) {
        return Promise.reject(new ReferenceError("Missing body"));
    }
    else if ("object" !== typeof body) {
        return Promise.reject(new TypeError("Body is not an object"));
    }
    else if (null === body as unknown) { // had to force type to avoid lint error
        return Promise.reject(new ReferenceError("Body is null"));
    }
    if ("undefined" === typeof body.path) {
        return Promise.reject(new ReferenceError("Missing \"path\" in body"));
    }
    else if ("string" !== typeof body.path) {
        return Promise.reject(new TypeError("\"path\" in body is not a string"));
    }
    else if (0 >= body.path.trim().length) {
        return Promise.reject(new RangeError("\"path\" in body is empty"));
    }

    return Promise.resolve().then((): iGithubRepository => {
        return _parseGithubPath(body.path);
    }).then(({ user, repo }: iGithubRepository): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> => {
        return container.get<Pluginsmanager>("plugins-manager").installViaGithub(user, repo, container);
    });

}
