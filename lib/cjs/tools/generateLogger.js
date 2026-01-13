"use strict";
// deps
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateLogger;
// externals
const winston_1 = __importDefault(require("winston"));
// module
function generateLogger(container) {
    const logger = winston_1.default.createLogger({
        "transports": [
            new winston_1.default.transports.File({
                "level": container.get("conf").get("debug") ? "debug" : "info",
                "filename": container.get("logs-file"),
                "format": winston_1.default.format.combine(winston_1.default.format.timestamp({
                    "format": "YYYY-MM-DD HH:mm:ss"
                }), winston_1.default.format.json())
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
    winston_1.default.addColors({
        "critical": "bold red",
        "error": "red",
        "warning": "yellow",
        "success": "green",
        "info": "blue",
        "debug": "grey"
    });
    if (container.get("conf").get("debug")) {
        logger.add(new winston_1.default.transports.Console({
            "level": "debug",
            "format": winston_1.default.format.combine(winston_1.default.format.timestamp({
                "format": "YYYY-MM-DD HH:mm:ss"
            }), winston_1.default.format.colorize({
                "level": true
            }), winston_1.default.format.printf(({ level, message, timestamp }) => {
                return timestamp + " " + level + ": " + message;
            }))
        }));
    }
    // replace basic logger
    container.set("log", logger);
}
