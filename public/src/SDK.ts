// deps

    // natives
    import { EventEmitter } from "events";

// types & interfaces

    // natives
    type Timeout = ReturnType<typeof setTimeout>;

    // locals
    import type { components, operations, paths } from "./Descriptor";
    type tEvents = components["schemas"]["PushEventPluginInstallRunning"] | components["schemas"]["PushEventPluginInstallStep"] | components["schemas"]["PushEventPluginInstallSuccess"] | components["schemas"]["PushEventPluginInstallFail"]
        | components["schemas"]["PushEventPluginUpdateRunning"]| components["schemas"]["PushEventPluginUpdateStep"] | components["schemas"]["PushEventPluginUpdateSuccess"] | components["schemas"]["PushEventPluginUpdateFail"]
        | components["schemas"]["PushEventPluginUninstallRunning"] | components["schemas"]["PushEventPluginUninstallSuccess"] | components["schemas"]["PushEventPluginUninstallFail"];

    type HttpMethodsOf<P extends keyof paths> = {
        [M in keyof paths[P]]: paths[P][M] extends { "responses": unknown }
            ? M
            : never;
    }[keyof paths[P]];

// component

export class SDK extends EventEmitter<{
    "connected": [];
    "disconnected": [ number, string ];
    "plugin-install-running": [ components["schemas"]["PushEventPluginInstallRunning"]["data"] ];
    "plugin-install-step": [ components["schemas"]["PushEventPluginInstallStep"]["data"] ];
    "plugin-install-success": [ components["schemas"]["PushEventPluginInstallSuccess"]["data"] ];
    "plugin-install-fail": [ components["schemas"]["PushEventPluginInstallFail"]["data"] ];
    "plugin-update-running": [ components["schemas"]["PushEventPluginUpdateRunning"]["data"] ];
    "plugin-update-step": [ components["schemas"]["PushEventPluginUpdateStep"]["data"] ];
    "plugin-update-success": [ components["schemas"]["PushEventPluginUpdateSuccess"]["data"] ];
    "plugin-update-fail": [ components["schemas"]["PushEventPluginUpdateFail"]["data"] ];
    "plugin-uninstall-running": [ components["schemas"]["PushEventPluginUninstallRunning"]["data"] ];
    "plugin-uninstall-success": [ components["schemas"]["PushEventPluginUninstallSuccess"]["data"] ];
    "plugin-uninstall-fail": [ components["schemas"]["PushEventPluginUninstallFail"]["data"] ];
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

        this._socket.onmessage = (event: MessageEvent<string>): void => {

            const parsedMessage: tEvents = JSON.parse(event.data) as tEvents;

            if ("core" === parsedMessage.plugin as string) { // must be forced string type to avoid useless type error

                switch (parsedMessage.command) {

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

    public login (name: string, password: string): Promise<operations["login"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/api/auth";
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

        const url: keyof paths = "/api/auth";
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

            return this._parseResponse(res) as Promise<operations["logout"]["responses"]["204"]["content"]["application/json"]>;

        });

    }

    public getDescriptor (): Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/api/descriptor";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]> => {

            return this._parseResponse(res) as Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]>;

        });

    }

    public getPlugins (): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins";
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

    public installPlugin (path: string): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins";
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

            return this._parseResponse(res) as Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]>;

        });

    }

    public getLastTag (name: string): Promise<operations["getPluginLatestTag"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins/{name}/latest-tag";
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

    public updatePlugin (name: string): Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins/{name}";
        const method: HttpMethodsOf<typeof url> = "post";

        return fetch(url.replace("{name}", name), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]> => {
            return this._parseResponse(res) as Promise<operations["updatePluginFromGithub"]["responses"]["204"]["content"]["application/json"]>;
        });

    }

    public deletePlugin (name: string): Promise<operations["deletePlugin"]["responses"]["204"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins/{name}";
        const method: HttpMethodsOf<typeof url> = "delete";

        return fetch(url.replace("{name}", name), {
            "method": method,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + this._token
            }
        }).then((res: Response): Promise<operations["deletePlugin"]["responses"]["204"]["content"]["application/json"]> => {
            return this._parseResponse(res) as Promise<operations["deletePlugin"]["responses"]["204"]["content"]["application/json"]>;
        });

    }

}

let _sdk: SDK | null = null;

export default function getSDK (): SDK {

    _sdk ??= new SDK();

    return _sdk;

}
