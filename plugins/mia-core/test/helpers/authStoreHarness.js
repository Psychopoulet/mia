// consts

    const SEEDED_USER_DATE = new Date("2024-01-01T00:00:00.000Z");
    const SEEDED_TOKEN_DATE = new Date("2024-01-02T00:00:00.000Z");
    const CREATED_USER_DATE = new Date("2024-02-01T00:00:00.000Z");

// module

// In-memory stand-in for the host User / Token models, limited to the surface used by the Mediator
function createAuthStore () {

    const users = [];
    const tokens = [];

    let lastId = 0;

    function findByName (name) {

        return users.find((user) => {
            return user.name === name;
        }) ?? null;

    }

    function removeUserTokens (idUser) {

        for (let i = tokens.length - 1; 0 <= i; --i) {

            if (tokens[i].idUser === idUser) {
                tokens.splice(i, 1);
            }

        }

    }

    function addUser (values, createdAt) {

        ++lastId;

        const user = {

            "id": lastId,
            "name": values.name,
            "password": values.password,
            "isAdmin": Boolean(values.isAdmin),
            "createdAt": createdAt,

            "update": (attributes) => {

                if ("string" === typeof attributes.password) {
                    user.password = attributes.password;
                }

                if ("boolean" === typeof attributes.isAdmin) {
                    user.isAdmin = attributes.isAdmin;
                }

                return Promise.resolve(user);

            },

            // the host User model hooks destroy the user tokens first
            "destroy": () => {

                removeUserTokens(user.id);
                users.splice(users.indexOf(user), 1);

                return Promise.resolve();

            }

        };

        users.push(user);

        return user;

    }

    return {

        "seedUser": (name, isAdmin, token) => {

            const user = addUser({
                "name": name,
                "password": "seeded",
                "isAdmin": isAdmin
            }, SEEDED_USER_DATE);

            if (token) {

                tokens.push({
                    "idUser": user.id,
                    "token": token,
                    "fingerprint": "fp-" + name,
                    "createdAt": SEEDED_TOKEN_DATE
                });

            }

            return user;

        },

        "User": {

            "findAll": () => {
                return Promise.resolve(users.slice());
            },

            "findOne": (options) => {
                return Promise.resolve(findByName(options.where.name));
            },

            "create": (values) => {
                return Promise.resolve(addUser(values, CREATED_USER_DATE));
            },

            // only called with { "where": { "isAdmin": true } }
            "count": () => {

                return Promise.resolve(users.filter((user) => {
                    return user.isAdmin;
                }).length);

            }

        },

        "Token": {

            "getUserByToken": (token) => {

                const row = tokens.find((current) => {
                    return current.token === token;
                });

                if (!row) {
                    return Promise.resolve();
                }

                const user = users.find((current) => {
                    return current.id === row.idUser;
                });

                if (!user) {
                    return Promise.resolve();
                }

                return Promise.resolve({
                    "name": user.name,
                    "isAdmin": Boolean(user.isAdmin),
                    "token": row.token
                });

            },

            "getByUserName": (name) => {

                const user = findByName(name);

                if (!user) {
                    return Promise.resolve([]);
                }

                return Promise.resolve(tokens.filter((row) => {
                    return row.idUser === user.id;
                }).map((row) => {

                    return {
                        "token": row.token,
                        "fingerprint": row.fingerprint,
                        "createdAt": row.createdAt
                    };

                }));

            },

            "destroy": (options) => {

                const index = tokens.findIndex((row) => {
                    return row.token === options.where.token;
                });

                if (-1 === index) {
                    return Promise.resolve(0);
                }

                tokens.splice(index, 1);

                return Promise.resolve(1);

            }

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
    createAuthStore,
    authHeaders
};
