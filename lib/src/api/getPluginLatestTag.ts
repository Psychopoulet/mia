// deps

    // externals
    import { NotFoundError } from "node-pluginsmanager-plugin";

// types & interfaces

    // externals
    import type ContainerPattern from "node-containerpattern";
    import type Pluginsmanager from "node-pluginsmanager";
    import type { Orchestrator } from "node-pluginsmanager-plugin";

    // locals
    import type { operations } from "./Descriptor";

    interface iGithubRepository {
        "type": string;
        "url": string;
    }

// module

export default function getPluginLatestTag (
    container: ContainerPattern,
    urlParamsPath: operations["getPluginLatestTag"]["parameters"]["path"]
): Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]> {

    if ("undefined" === typeof urlParamsPath) {
        return Promise.reject(new ReferenceError("Missing urlParamsPath"));
    }
    else if ("object" !== typeof urlParamsPath) {
        return Promise.reject(new TypeError("urlParamsPath is not an object"));
    }
    else if (null === urlParamsPath as unknown) { // had to force type to avoid lint error
        return Promise.reject(new ReferenceError("urlParamsPath is null"));
    }
        else if ("string" !== typeof urlParamsPath.name) {
            return Promise.reject(new TypeError("\"name\" in urlParamsPath is not a string"));
        }
        else if (0 >= urlParamsPath.name.trim().length) {
            return Promise.reject(new RangeError("\"name\" in urlParamsPath is empty"));
        }

    try {

        const pluginsManager: Pluginsmanager = container.get<Pluginsmanager>("plugins-manager");
        const plugin: Orchestrator | undefined = pluginsManager.plugins.find((p: Orchestrator): boolean => {
            return p.name === urlParamsPath.name;
        });

        if (!plugin) {
            return Promise.reject(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" not found"));
        }

        if ("undefined" === typeof (plugin as unknown as { "repository": iGithubRepository }).repository) {
            return Promise.reject(new NotFoundError("Plugin \"" + urlParamsPath.name + "\" has no repository"));
        }

        const repository: iGithubRepository = (plugin as unknown as { "repository": iGithubRepository }).repository;

        if ("string" !== typeof repository.url) {
            return Promise.reject(new TypeError("\"url\" in repository is not a string"));
        }
        else if (0 >= repository.url.trim().length) {
            return Promise.reject(new RangeError("\"url\" in repository is empty"));
        }

        const url: string = repository.url.trim();

        const urlMatch: RegExpExecArray | null = /github\.com[/:]([^/]+)\/([^/]+)/u.exec(url);
        const shortMatch: RegExpExecArray | null = /^github:([^/]+)\/([^/]+)$/u.exec(url);
        const match: RegExpExecArray | null = urlMatch ?? shortMatch;

        if (!match) {
            return Promise.reject(new Error("Invalid GitHub repository path"));
        }

        const user: string = match[1];
        const repo: string = match[2].replace(".git", "");

        return pluginsManager.getLatestGithubTag(user, repo);

    }
    catch (err: unknown) {
        return Promise.reject(err);
    }

}
