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
        "extends": [ personnallinter.configs["react"] ],
        "languageOptions": {
            "parserOptions": {
                "project": "./tsconfig-front.json",
                "projectService": false,
                "tsconfigRootDir": __dirname
            }
        }
    },
    globalIgnores([ "public/src/Descriptor.ts" ])
]);
