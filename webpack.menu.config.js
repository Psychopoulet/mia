// deps

    // natives
    const { join } = require("node:path");

    // locals
    const webpackConfig = require(join(__dirname, "webpack.config.js"));

// consts

    const PUBLIC = join(__dirname, "public");

// module

module.exports = {

    ...webpackConfig,

    "entry": join(PUBLIC, "src", "menu.tsx"),

    "output": {
        "filename": "menu.min.js",
        "path": join(PUBLIC, "dist")
    }

};
