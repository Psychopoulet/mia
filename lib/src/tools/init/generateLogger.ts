// deps

    // externals
    import winston from "winston";
    import Transport from "winston-transport";

    // locals
    import Log from "../models/Log";

// types & interfaces

    // externals
    import type ConfManager from "node-confmanager";
    import type ContainerPattern from "node-containerpattern";

    // local

    export interface iLogger {
        "critical": (content: string) => void,
        "error": (content: string) => void,
        "warning": (content: string) => void,
        "success": (content: string) => void,
        "info": (content: string) => void,
        "debug": (content: string) => void
    }

    interface iLogInfo {
        [key: string]: unknown;
        "level"?: unknown;
        "message"?: unknown;
        "timestamp"?: unknown;
    }

// module

class SequelizeTransport extends Transport {

    public log (info: iLogInfo, callback: () => void): void {

        const { level, message, "timestamp": rawTimestamp, ...meta } = info;

        let timestamp: Date = new Date();

        if (rawTimestamp instanceof Date) {
            timestamp = rawTimestamp;
        }
        else if ("string" === typeof rawTimestamp || "number" === typeof rawTimestamp) {
            timestamp = new Date(rawTimestamp);
        }

        Log.create({
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

export default function generateLogger (container: ContainerPattern): void {

    const conf: ConfManager = container.get<ConfManager>("conf");
    const logLevel: string = conf.get<boolean>("debug") ? "debug" : "info";

    const logger = winston.createLogger({

        "transports": [
            new winston.transports.File({
                "level": logLevel,
                "filename": container.get<string>("logs-file"),
                "format": winston.format.combine(
                    winston.format.timestamp({
                        "format": "YYYY-MM-DD HH:mm:ss"
                    }),
                    winston.format.json()
                )
            }),
            // extra destination: persist the same logs in SQL (database already exists)
            new SequelizeTransport({
                "level": logLevel,
                "format": winston.format.timestamp({
                    "format": "YYYY-MM-DD HH:mm:ss"
                })
            })
        ],

        "levels": {
            "critical": 0,
            "error": 1,
            "warning": 2,
            "success": 3,
            "info": 4,
            "debug": 5
        }

    });

    winston.addColors({
        "critical": "bold red",
        "error": "red",
        "warning": "yellow",
        "success": "green",
        "info": "blue",
        "debug": "grey"
    });

    if (conf.get<boolean>("debug")) {

        logger.add(new winston.transports.Console({
            "level": "debug",
            "format": winston.format.combine(
                winston.format.timestamp({
                    "format": "YYYY-MM-DD HH:mm:ss"
                }),
                winston.format.colorize({
                    "level": true
                }),
                winston.format.printf(({ level, message, timestamp }): string => {
                    return String(timestamp) + " " + String(level) + ": " + String(message);
                })
            )
        }));

    }

    // replace basic logger

    container.set("log", logger);

}
