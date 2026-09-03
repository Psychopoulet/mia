# mia-core

MIA core plugin — authentication, plugin lifecycle, and the main web UI.

## Badges

[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)
[![Issues](https://img.shields.io/github/issues/Psychopoulet/mia.svg)](https://github.com/Psychopoulet/mia/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/Psychopoulet/mia.svg)](https://github.com/Psychopoulet/mia/pulls)

[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Psychopoulet_mia&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Psychopoulet_mia)

[![Known Vulnerabilities](https://snyk.io/test/github/Psychopoulet/mia/badge.svg)](https://snyk.io/test/github/Psychopoulet/mia)

## OpenAPI

[API Descriptor](./lib/data/Descriptor.json)

## Sign in

Open the app. Enter your name and password, then submit **Login**.

If the database is empty, a first user is created automatically so you can sign in.

## Plugins

After login, the board lists every installed plugin. Each card shows the plugin's data

The plugin name opens that plugin’s own screen.

On a card you can:

- view the latest GitHub tag (current tag vs last tag)
- update the plugin from GitHub
- delete the plugin
