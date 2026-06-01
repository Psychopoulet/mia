// deps

    // natives
    import { EventEmitter } from "events";

// types & interfaces

    // natives
    type Timeout = ReturnType<typeof setTimeout>;

    // locals
    import type { paths, operations } from "./Descriptor";

    type NonNeverKeys<T> = {
        [K in keyof T]: T[K] extends never ? never : K
    }[keyof T];

    type HttpMethodsOf<P extends keyof paths> = Exclude<
        NonNeverKeys<paths[P]>,
        "parameters"
    >;

// component

export class SDK extends EventEmitter<{
    "connected": [];
    "disconnected": [ number, string ];
}> {

    // protected

        protected _socket: WebSocket | null;
        protected _reconnectTimeout: Timeout | null;

    // constructor

    public constructor () {

        super();

        this._socket = null;
        this._reconnectTimeout = null;

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

    public getDescriptor (): Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/api/descriptor";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            }
        }).then((res: Response): Promise<operations["getDescriptor"]["responses"]["200"]["content"]["application/json"]> => {

            if (res.ok) {
                return res.json();
            }

            return new Promise((resolve: unknown, reject: (error: Error) => void): void => {

                res.json().then((content: operations["getDescriptor"]["responses"]["default"]["content"]["application/json"]): void => {
                    return reject(new Error(content.message));
                }).catch((): void => {
                    return reject(new Error("Problem with request getDescriptor has status '" + res.status + "' (" + res.statusText + ")"));
                });

            });

        });

    }

    public getPlugins (): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins";
        const method: HttpMethodsOf<typeof url> = "get";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            }
        }).then((res: Response): Promise<operations["getPlugins"]["responses"]["200"]["content"]["application/json"]> => {

            if (res.ok) {
                return res.json();
            }

            return new Promise((resolve: unknown, reject: (error: Error) => void): void => {

                res.json().then((content: operations["getPlugins"]["responses"]["default"]["content"]["application/json"]): void => {
                    return reject(new Error(content.message));
                }).catch((): void => {
                    return reject(new Error("Problem with request getPlugins has status '" + res.status + "' (" + res.statusText + ")"));
                });

            });

        });

    }

    public installPlugin (path: string): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> {

        const url: keyof paths = "/api/plugins";
        const method: HttpMethodsOf<typeof url> = "put";

        return fetch(url, {
            "method": method,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "path": path
            })
        }).then((res: Response): Promise<operations["installPluginFromGithub"]["responses"]["201"]["content"]["application/json"]> => {

            if (res.ok) {
                return res.json();
            }

            return new Promise((resolve: unknown, reject: (error: Error) => void): void => {

                res.json().then((content: operations["installPluginFromGithub"]["responses"]["default"]["content"]["application/json"]): void => {
                    return reject(new Error(content.message));
                }).catch((): void => {
                    return reject(new Error("Problem with request installPlugin has status '" + res.status + "' (" + res.statusText + ")"));
                });

            });

        });

    }

}

let _sdk: SDK | null = null;

export default function getSDK (): SDK {

    _sdk ??= new SDK();

    return _sdk;

}
