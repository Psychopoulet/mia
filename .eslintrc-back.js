// deps

    // externals
    const { defineConfig, globalIgnores } = require("eslint/config");
    const personnallinter = require("eslint-plugin-personnallinter");

// module

module.exports = defineConfig([
    {
        "plugins": {
            personnallinter
        },
        "extends": [ personnallinter.configs["ts-back"] ],
        "languageOptions": {
            "globals": {
                "Bun": "readonly"
            }
        }
    },
    globalIgnores([ "lib/src/api/Descriptor.ts" ])
]);
