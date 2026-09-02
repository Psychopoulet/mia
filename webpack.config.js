// deps

    // natives
    const { join } = require("node:path");

    // externals
    const TerserPlugin = require("terser-webpack-plugin");

// consts

    const PUBLIC = join(__dirname, "public");

// module

module.exports = {

    "mode": "development",

    "entry": join(PUBLIC, "menu-src", "index.tsx"),

    "output": {
        "filename": "menu.min.js",
        "path": join(PUBLIC, "dist")
    },

    "devtool": "source-map",

    "module": {
        "rules": [
            {
                "test": /\.tsx?$/,
                "exclude": [ /node_modules/ ],
                "use": [
                    {
                        "loader": "ts-loader",
                        "options": {
                            "configFile": join(__dirname, "tsconfig-front.json")
                        }
                   }
                ]
            }
        ]
    },
    "optimization": {
        "minimize": true,
        "minimizer": [
            new TerserPlugin({
                "parallel": true,
                "terserOptions": {
                    "format": {
                        "comments": false
                    }
                },
                "extractComments": false
            })
        ]
    },

    "resolve": {
        "extensions": [ ".tsx", ".ts", ".js" ],
    }

};
