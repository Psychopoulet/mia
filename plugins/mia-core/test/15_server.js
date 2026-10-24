// deps

    // natives
    const { deepStrictEqual, strictEqual } = require("node:assert");
    const { EventEmitter } = require("node:events");
    const { join } = require("node:path");

    // locals
    const Server = require(join(__dirname, "..", "lib", "src", "Server.ts")).default;

// tests

describe("server", () => {

    it("should forward mediator events and stop after release", () => {

        const mediator = new EventEmitter();
        const pushes = [];
        const server = new Server({
            "externalResourcesDirectory": ""
        });

        server._Mediator = mediator;
        server.push = (command, data) => {

            pushes.push({
                "command": command,
                "data": data
            });

            return server;

        };

        return server._initWorkSpace().then(() => {

            const events = [
                {
                    "name": "initialized"
                },
                {
                    "name": "released"
                },
                {
                    "data": {
                        "message": "boom"
                    },
                    "name": "error"
                },
                {
                    "data": {
                        "plugin": "demo"
                    },
                    "name": "plugin-install-running"
                },
                {
                    "data": {
                        "step": "clone"
                    },
                    "name": "plugin-install-step"
                },
                {
                    "data": {
                        "plugin": "demo"
                    },
                    "name": "plugin-install-success"
                },
                {
                    "data": {
                        "message": "install-fail"
                    },
                    "name": "plugin-install-fail"
                },
                {
                    "data": {
                        "plugin": "demo"
                    },
                    "name": "plugin-update-running"
                },
                {
                    "data": {
                        "step": "fetch"
                    },
                    "name": "plugin-update-step"
                },
                {
                    "data": {
                        "message": "update-fail"
                    },
                    "name": "plugin-update-fail"
                },
                {
                    "data": {
                        "plugin": "demo"
                    },
                    "name": "plugin-uninstall-running"
                },
                {
                    "data": {
                        "plugin": "demo"
                    },
                    "name": "plugin-uninstall-success"
                },
                {
                    "data": {
                        "message": "uninstall-fail"
                    },
                    "name": "plugin-uninstall-fail"
                },
                {
                    "data": {
                        "name": "alice"
                    },
                    "name": "user.added"
                },
                {
                    "data": {
                        "name": "alice"
                    },
                    "name": "user.removed"
                }
            ];

            events.forEach((event) => {
                mediator.emit(event.name, event.data);
            });

            deepStrictEqual(pushes.map((item) => {
                return item.command;
            }), events.map((event) => {
                return event.name;
            }), "forwarded commands are not as expected");

            strictEqual(pushes[2].data.message, "boom", "error data is not as expected");

            return server._releaseWorkSpace();

        }).then(() => {

            const count = pushes.length;

            mediator.emit("initialized");
            strictEqual(pushes.length, count, "released server must ignore mediator events");

        });

    });

});
