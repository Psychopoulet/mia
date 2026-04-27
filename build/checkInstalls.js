// deps

    // natives
    const { readdir, readFile, rm } = require("node:fs/promises");
    const { stat } = require("node:fs");
    const { join } = require("node:path");
    const { homedir } = require("node:os");
    const { exec } = require("node:child_process");

// consts

    const pluginsDirectories = [];
    const filesToRemove = [];

// module

Promise.resolve().then(() => {

    return readFile(join(__dirname, "..", "package.json"), "utf-8").then((data) => {
        return JSON.parse(data);
    });

}).then(({ name }) => {

    return join(homedir(), name, "plugins");

}).then((pluginsDirectory) => {

    return new Promise((resolve, reject) => {

        return stat(pluginsDirectory, (err, stats) => {
            return err ? resolve(false) : resolve(stats.isDirectory());
        });

    }).then((exists) => {

        if (!exists) {
            process.exit(0);
            return;
        }

        return pluginsDirectory;

    });

}).then((pluginsDirectory) => {

    console.log("plugins directory:", pluginsDirectory);

    return readdir(pluginsDirectory).then((plugins) => {

        console.log("plugins detected:", plugins);

        return Promise.all(plugins.map((plugin) => {

            pluginsDirectories.push(join(pluginsDirectory, plugin));

            return readdir(join(pluginsDirectory, plugin)).then((files) => {

                files.forEach((file) => {

                    if ([ "node_modules", "package-lock.json" ].includes(file)) {
                        filesToRemove.push(join(pluginsDirectory, plugin, file));
                    }

                });

            });

        })).then(() => {
            return filesToRemove;
        });

    });

}).then((filesToRemove) => {

    return Promise.all(filesToRemove.map((file) => {
        return rm(file, { "recursive": true });
    })).then(() => {
        console.log("All plugins install files removed");
    });

}).then(() => {

    return Promise.all(pluginsDirectories.map((pluginDirectory) => {

        return new Promise((resolve, reject) => {

            exec("npm install --omit=dev --omit=optional", { "cwd": pluginDirectory }, (err, stdout) => {
                return err ? reject(err) : resolve(stdout);
            });

        });

    })).then(() => {
        console.log("All plugins re-installed");
    });

}).then(() => {

    process.exit(0);

}).catch((err) => {

    console.error(err);
    process.exit(1);

});
