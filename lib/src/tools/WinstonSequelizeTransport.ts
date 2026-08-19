// deps

    // externals
    import Transport from "winston-transport";

// types & interfaces

    // locals
    import type Log from "./models/Log";

    export interface WinstonSequelizeTransportOptions {
        "level"?: string;
        "model": typeof Log;
    }

    interface iLogInfo {
        [key: string]: unknown;
        "level"?: unknown;
        "message"?: unknown;
        "timestamp"?: unknown;
    }

// module

export default class WinstonSequelizeTransport extends Transport {

    private readonly _model: typeof Log;

    public constructor (opts: WinstonSequelizeTransportOptions) {

        super(opts);

        this._model = opts.model;

    }

    public log (info: iLogInfo, callback: () => void): void {

        const { level, message, "timestamp": rawTimestamp, ...meta } = info;

        let timestamp: Date = new Date();

        if (rawTimestamp instanceof Date) {
            timestamp = rawTimestamp;
        }
        else if ("string" === typeof rawTimestamp || "number" === typeof rawTimestamp) {
            timestamp = new Date(rawTimestamp);
        }

        this._model.create({
            "level": String(level),
            "message": String(message),
            "timestamp": Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
            "meta": 0 < Object.keys(meta).length ? meta : null
        }).then((): void => {

            this.emit("logged", info);
            callback();

        }).catch((err: Error): void => {

            // never log through Winston here: that would recurse into this transport
            this.emit("error", err);
            callback();

        });

    }

}
