// module

function createAuthDb () {

    const users = new Map();
    const tokensByUser = new Map();
    const tokenOwners = new Map();

    function ensureUserTokens (name) {

        if (!tokensByUser.has(name)) {
            tokensByUser.set(name, []);
        }

        return tokensByUser.get(name);

    }

    return {

        "seedUser": (name, isAdmin, token) => {

            users.set(name, {
                "name": name,
                "isAdmin": Boolean(isAdmin),
                "createdAt": new Date("2024-01-01T00:00:00.000Z")
            });

            ensureUserTokens(name);

            if (token) {

                tokenOwners.set(token, {
                    "name": name,
                    "isAdmin": Boolean(isAdmin),
                    "token": token
                });

                ensureUserTokens(name).push({
                    "token": token,
                    "fingerprint": "fp-" + name,
                    "createdAt": new Date("2024-01-02T00:00:00.000Z")
                });

            }

        },

        "getUsers": () => {
            return Promise.resolve(Array.from(users.values()));
        },

        "getUserByName": (name) => {
            return Promise.resolve(users.get(name));
        },

        "addUser": (name, _password, isAdmin = false) => {

            users.set(name, {
                "name": name,
                "isAdmin": Boolean(isAdmin),
                "createdAt": new Date("2024-02-01T00:00:00.000Z")
            });

            ensureUserTokens(name);

            return Promise.resolve();

        },

        "editUserPassword": () => {
            return Promise.resolve();
        },

        "editUserIsAdmin": (name, isAdmin) => {

            const user = users.get(name);

            if (user) {
                user.isAdmin = Boolean(isAdmin);
            }

            return Promise.resolve();

        },

        "removeUser": (name) => {

            users.delete(name);
            tokensByUser.delete(name);

            for (const [ token, owner ] of tokenOwners.entries()) {

                if (owner.name === name) {
                    tokenOwners.delete(token);
                }

            }

            return Promise.resolve();

        },

        "getTokensByUserName": (name) => {
            return Promise.resolve(ensureUserTokens(name).slice());
        },

        "getUserByToken": (token) => {
            return Promise.resolve(tokenOwners.get(token));
        },

        "removeToken": (token) => {

            const owner = tokenOwners.get(token);

            if (!owner) {
                return Promise.resolve();
            }

            tokenOwners.delete(token);

            const list = ensureUserTokens(owner.name);
            const index = list.findIndex((item) => {
                return item.token === token;
            });

            if (-1 < index) {
                list.splice(index, 1);
            }

            return Promise.resolve();

        }

    };

}

function authHeaders (token) {

    return {
        "headers": {
            "authorization": "Bearer " + token
        }
    };

}

module.exports = {
    createAuthDb,
    authHeaders
};
