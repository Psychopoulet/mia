// types & interfaces

export interface iGithubRepository {
    "user": string;
    "repo": string;
}

// module

export default function parseGithubPath (github: string): iGithubRepository {

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
