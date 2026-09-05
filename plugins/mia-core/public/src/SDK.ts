// deps

    // locals
    import EventEmitter from "./EventEmitter";

// types & interfaces

    // natives
    type Timeout = ReturnType<typeof setTimeout>;

    // locals
    import type { components, paths, operations } from "./Descriptor";
    type tEvents = components["schemas"]["PushEventPluginInitialized"] | components["schemas"]["PushEventPluginReleased"] | components["schemas"]["PushEventPluginError"]
        | components["schemas"]["PushEventPluginInstallRunning"] | components["schemas"]["PushEventPluginInstallStep"] | components["schemas"]["PushEventPluginInstallSuccess"] | components["schemas"]["PushEventPluginInstallFail"]
        | components["schemas"]["PushEventPluginUpdateRunning"] | components["schemas"]["PushEventPluginUpdateStep"] | components["schemas"]["PushEventPluginUpdateSuccess"] | components["schemas"]["PushEventPluginUpdateFail"]
        | components["schemas"]["PushEventPluginUninstallRunning"] | components["schemas"]["PushEventPluginUninstallSuccess"] | components["schemas"]["PushEventPluginUninstallFail"]
        | components["schemas"]["PushEventUserAdded"] | components["schemas"]["PushEventUserRemoved"];

    type HttpMethodsOf<P extends keyof paths> = {
        [M in keyof paths[P]]: paths[P][M] extends { "responses": unknown }
            ? M
            : never;
    }[keyof paths[P]];

// component

export class SDK extends EventEmitter<{
    "connected": [];
    "disconnected": [ number, string ];
    "initialized": [];
    "released": [];
    "error": [ components["schemas"]["PushEventPluginError"]["data"] ];
    "plugin-install-running": [ components["schemas"]["PushEventPluginInstallRunning"]["data"] ];
    "plugin-install-step": [ components["schemas"]["PushEventPluginInstallStep"]["data"] ];
    "plugin-install-success": [ components["schemas"]["PushEventPluginInstallSuccess"]["data"] ];
    "plugin-install-fail": [ components["schemas"]["PushEventPluginInstallFail"]["data"] ];
    "plugin-update-running": [ components["schemas"]["PushEventPluginUpdateRunning"]["data"] ];
    "plugin-update-step": [ components["schemas"]["PushEventPluginUpdateStep"]["data"] ];
    "plugin-update-fail": [ components["schemas"]["PushEventPluginUpdateFail"]["data"] ];
    "plugin-update-success": [ components["schemas"]["PushEventPluginUpdateSuccess"]["data"] ];
    "plugin-uninstall-running": [ components["schemas"]["PushEventPluginUninstallRunning"]["data"] ];
    "plugin-uninstall-success": [ components["schemas"]["PushEventPluginUninstallSuccess"]["data"] ];
    "plugin-uninstall-fail": [ components["schemas"]["PushEventPluginUninstallFail"]["data"] ];
    "user.added": [ components["schemas"]["User"] ];
    "user.removed": [ components["schemas"]["User"] ];
}> {

    // static

        private static readonly _tokenKey: string = "MIAApp-token-auth";

    // protected

        protected _socket: WebSocket | null;
        protected _reconnectTimeout: Timeout | null;
        protected _token: string | null;

    // constructor

    public constructor () {

        super();

        this._socket = null;
        this._reconnectTimeout = null;

        this._token = localStorage.getItem(SDK._tokenKey);

    }

    // protected methods

    protected _parseResponse (res: Response): Promise<unknown> {

        if (res.ok) {

            return new Promise((resolve: (content: unknown) => void, reject: (error: Error) => void): void => {

                res.text().then((content: string): void => {

                    try {
                        return resolve(JSON.parse(content));
                    }
                    catch (e: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
                        return resolve(content);
                    }

                }).catch((err: Error): void => {
                    console.warn(err);
                    return reject(new Error("Impossible to parse response"));
                });

            });

        }

        return new Promise((resolve: unknown, reject: (error: Error) => void): void => {

            res.json().then((content: components["schemas"]["Error"]): void => {
                return reject(new Error(content.message));
            }).catch((): void => {
                return reject(new Error("Problem with request, has status '" + res.status + "' (" + res.statusText + ")"));
            });

        });

    }

    protected _parseTextResponse (res: Response): Promise<string> {

        if (res.ok) {
            return res.text();
        }

        // on a failed request, "_parseResponse" only rejects with the formatted error
        return this._parseResponse(res) as Promise<string>;

    }

    // public methods

    public connect (): void {

        if (WebSocket.OPEN === this._socket?.readyState) {
            return;
        }

        if (this._reconnectTimeout) {
            return;
        }

        this._socket = new WebSocket(
            ("https:" === window.location.protocol ? "wss:" : "ws:")
            + "//" + window.location.host
        );

        this._socket.onopen = (): void => {
            this.emit("connected");
        };

        this._socket.onclose = (event: CloseEvent): void => {

            this.emit("disconnected", event.code, event.reason);

            // normal closure
            if (1000 === event.code) {
                return;
            }

            this._reconnectTimeout = setTimeout((): void => {
                this._reconnectTimeout = null;
                return this.connect();
            }, 1000);

        };

        this._socket.onerror = (evt: Event): void => {

            // avoid catching error on reconnection
            if (evt instanceof ErrorEvent) {

                this.emit("error", {
                    "code": "unknown",
                    "message": evt.message
                });

            }

        };

        this._socket.onmessage = (event: MessageEvent<string>): void => {

            const parsedMessage: tEvents = JSON.parse(event.data) as tEvents;

            // must disable the rule because the plugin name can be sended by another plugin
            if ("mia-core" === parsedMessage.plugin) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition

                switch (parsedMessage.command) {

                    case "initialized":
                        this.emit("initialized");
                    break;
                    case "released":
                        this.emit("released");
                    break;
                    case "error":
                        this.emit("error", parsedMessage.data);
                    break;
                    case "plugin-install-running":
                        this.emit("plugin-install-running", parsedMessage.data);
                    break;
                    case "plugin-install-step":
                        this.emit("plugin-install-step", parsedMessage.data);
                    break;
                    case "plugin-install-success":
                        this.emit("plugin-install-success", parsedMessage.data);
                    break;
                    case "plugin-install-fail":
                        this.emit("plugin-install-fail", parsedMessage.data);
                    break;
                    case "plugin-update-running":
                        this.emit("plugin-update-running", parsedMessage.data);
                    break;
                    case "plugin-update-step":
                        this.emit("plugin-update-step", parsedMessage.data);
                    break;
                    case "plugin-update-success":
                        this.emit("plugin-update-success", parsedMessage.data);
                    break;
                    case "plugin-update-fail":
                        this.emit("plugin-update-fail", parsedMessage.data);
                    break;
                    case "plugin-uninstall-running":
                        this.emit("plugin-uninstall-running", parsedMessage.data);
                    break;
                    case "plugin-uninstall-success":
                        this.emit("plugin-uninstall-success", parsedMessage.data);
                    break;
                    case "plugin-uninstall-fail":
                        this.emit("plugin-uninstall-fail", parsedMessage.data);
                    break;
                    case "user.added":
                        this.emit("user.added", parsedMessage.data);
                    break;
                    case "user.removed":
                        this.emit("user.removed", parsedMessage.data);
                    break;

                    default:
                        // nothing to do here
                    break;

                }

            }

        };

    }

    public disconnect (): void {

        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }

        if (this._socket
            && (
                WebSocket.CONNECTING === this._socket.readyState
                || WebSocket.OPEN === this._socket.readyState
            )
        ) {
            this._socket.close(1000, "Normal closure");
        }

        this._socket = null;

    }

    // api

    public isLoggedIn (): boolean {
        return Boolean(this._token);
    }

    public getPluginDescriptor (): Promise<operations["getPluginDescriptor"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/descriptor";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getPluginDescriptor"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getPluginDescriptor"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public getPluginStatus (): Promise<operations["getPluginStatus"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/status";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getPluginStatus"]["responses"]["200"]["content"]["application/json"]> => {

            if (404 === res.status) {
                return Promise.resolve("RELEASED");
            }

            return this._parseResponse(res) as Promise<operations["getPluginStatus"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public login (name: string, password: string): Promise<operations["login"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/auth";
        const method: HttpMethodsOf<typeof url> = "put";
        const body: operations["login"]["requestBody"]["content"]["application/json"] = {
            "name": name,
            "password": password
        };

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(body)
        }).then((res: Response): Promise<operations["login"]["responses"]["201"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["login"]["responses"]["201"]["content"]["application/json"]>;

        }).then((response: operations["login"]["responses"]["201"]["content"]["application/json"]): operations["login"]["responses"]["201"]["content"]["application/json"] => {

            this._token = response;
            localStorage.setItem(SDK._tokenKey, this._token);

            return response;

        });

    }

    public logout (): Promise<operations["logout"]["responses"]["204"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/auth";
        const method: HttpMethodsOf<typeof url> = "delete";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["logout"]["responses"]["204"]["content"]["application/json"]> => {

            localStorage.removeItem(SDK._tokenKey);
            this._token = null;

            return this._parseResponse(res);

        });

    }

    public getPlugins (): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/plugins";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public installPluginFromGithub (path: string): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/plugins";
        const method: HttpMethodsOf<typeof url> = "put";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            },
            "body": JSON.stringify({
                "path": path
            })
        }).then((res: Response): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> => {

            return this._parseResponse(res);

        });

    }

    public getPluginLatestTag (name: string): Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/plugins/{name}/latest-tag";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url.replace("{name}", name), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]> => {
            return this._parseResponse(res) as Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]>;
        });

    }

    public updatePluginFromGithub (name: string): Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/plugins/{name}";
        const method: HttpMethodsOf<typeof url> = "post";

        return fetch(url.replace("{name}", name), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]> => {
            return this._parseResponse(res);
        });

    }

    public deletePlugin (name: string): Promise<operations["deletePlugin"]["responses"]["204"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/plugins/{name}";
        const method: HttpMethodsOf<typeof url> = "delete";

        return fetch(url.replace("{name}", name), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["deletePlugin"]["responses"]["204"]["content"]["application/json"]> => {
            return this._parseResponse(res);
        });

    }

    public getUsers (): Promise<operations["getUsers"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/users";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getUsers"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getUsers"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public createUser (
        data: operations["createUser"]["requestBody"]["content"]["application/json"]
    ): Promise<operations["createUser"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/mia-core/api/users";
        const method: HttpMethodsOf<typeof url> = "put";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            },
            "body": JSON.stringify(data)
        }).then((res: Response): Promise<operations["createUser"]["responses"]["201"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["createUser"]["responses"]["201"]["content"]["application/json"]>;

        });

    }

    public getUser (
        name: operations["getUser"]["parameters"]["path"]["name"]
    ): Promise<operations["getUser"]["responses"]["200"]["content"]["application/json"]> {

        const url: `/mia-core/api/users/${string}` = `/mia-core/api/users/${encodeURIComponent(name)}`;
        const method: HttpMethodsOf<"/mia-core/api/users/{name}"> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getUser"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getUser"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public updateUser (
        name: operations["updateUser"]["parameters"]["path"]["name"],
        data: operations["updateUser"]["requestBody"]["content"]["application/json"]
    ): Promise<operations["updateUser"]["responses"]["200"]["content"]["application/json"]> {

        const url: `/mia-core/api/users/${string}` = `/mia-core/api/users/${encodeURIComponent(name)}`;
        const method: HttpMethodsOf<"/mia-core/api/users/{name}"> = "post";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            },
            "body": JSON.stringify(data)
        }).then((res: Response): Promise<operations["updateUser"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["updateUser"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public deleteUser (name: operations["deleteUser"]["parameters"]["path"]["name"]): Promise<void> {

        const url: `/mia-core/api/users/${string}` = `/mia-core/api/users/${encodeURIComponent(name)}`;
        const method: HttpMethodsOf<"/mia-core/api/users/{name}"> = "delete";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<void> => {

            if (res.ok) {
                return Promise.resolve();
            }

            return this._parseResponse(res) as Promise<void>;

        });

    }

    public getUserTokens (
        name: operations["getUserTokens"]["parameters"]["path"]["name"]
    ): Promise<operations["getUserTokens"]["responses"]["200"]["content"]["application/json"]> {

        const url: `/mia-core/api/users/${string}/tokens` = `/mia-core/api/users/${encodeURIComponent(name)}/tokens`;
        const method: HttpMethodsOf<"/mia-core/api/users/{name}/tokens"> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getUserTokens"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getUserTokens"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public deleteToken (
        data: operations["deleteToken"]["requestBody"]["content"]["application/json"]
    ): Promise<void> {

        const url: keyof paths = "/mia-core/api/tokens";
        const method: HttpMethodsOf<typeof url> = "delete";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            },
            "body": JSON.stringify(data)
        }).then((res: Response): Promise<void> => {

            if (res.ok) {
                return Promise.resolve();
            }

            return this._parseResponse(res) as Promise<void>;

        });

    }

    // any signed-in user
    public getLogs (
        from: string, to: string, level?: components["schemas"]["LogLevel"]
    ): Promise<operations["getLogs"]["responses"]["200"]["content"]["text/plain"]> {

        const url: keyof paths = "/mia-core/api/logs";
        const method: HttpMethodsOf<typeof url> = "get";

        const query: URLSearchParams = new URLSearchParams({
            "from": from,
            "to": to
        });

        if ("undefined" !== typeof level) {
            query.set("level", level);
        }

        return fetch(url + "?" + query.toString(), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getLogs"]["responses"]["200"]["content"]["text/plain"]> => {

            return this._parseTextResponse(res);

        });

    }

    // only admins
    public deleteLogs (from: string, to: string): Promise<void> {

        const url: keyof paths = "/mia-core/api/logs";
        const method: HttpMethodsOf<typeof url> = "delete";

        const query: URLSearchParams = new URLSearchParams({
            "from": from,
            "to": to
        });

        return fetch(url + "?" + query.toString(), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<void> => {

            if (res.ok) {
                return Promise.resolve();
            }

            return this._parseResponse(res) as Promise<void>;

        });

    }

}

let _sdk: SDK | null = null;

export default function getSDK (): SDK {

    _sdk ??= new SDK();

    return _sdk;

}
