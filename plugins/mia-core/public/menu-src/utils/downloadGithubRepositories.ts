// types & interfaces

    interface iGithubRepository {
        "name": string;
    }

// private

    function _isGithubRepository (value: unknown): value is iGithubRepository {

        return "object" === typeof value
            && null !== value
            && "name" in value
            && "string" === typeof value.name;

    }

// module

export default function downloadGithubRepositories (user: string): Promise<string[]> {

    return fetch("https://api.github.com/users/" + encodeURIComponent(user) + "/repos?type=owner", {
        "headers": {
            "Accept": "application/vnd.github+json"
        }
    }).then((res: Response): Promise<unknown> => {

        if (!res.ok) {

            return res.json().then((content: unknown): Promise<never> => {

                const message: string = "object" === typeof content && null !== content && "message" in content && "string" === typeof content.message
                    ? content.message
                    : "Impossible to list repositories (" + String(res.status) + ")";

                return Promise.reject(new Error(message));

            }, (): Promise<never> => {

                return Promise.reject(new Error("Impossible to list repositories (" + String(res.status) + ")"));

            });

        }

        return res.json();

    }).then((body: unknown): string[] => {

        if (!Array.isArray(body)) {
            throw new Error("Impossible to list repositories");
        };

        const repositories: string[] = body.reduce((names: string[], item: unknown): string[] => {

            if (_isGithubRepository(item) && item.name.startsWith("mia-")) {
                names.push(item.name);
            }

            return names;

        }, []).sort((a: string, b: string): number => {
            return a.localeCompare(b);
        });

        return repositories;

    });

}
