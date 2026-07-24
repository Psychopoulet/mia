// deps

    // externals
    import winston from "winston";

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

// module

export default function generateLogger (container: ContainerPattern): void {

    const logger = winston.createLogger({

        "transports": [
            new winston.transports.File({
                "level": container.get<ConfManager>("conf").get<boolean>("debug") ? "debug" : "info",
                "filename": container.get<string>("logs-file"),
                "format": winston.format.combine(
                    winston.format.timestamp({
                        "format": "YYYY-MM-DD HH:mm:ss"
                    }),
                    winston.format.json()
                )
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

    if (container.get<ConfManager>("conf").get<boolean>("debug")) {

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
