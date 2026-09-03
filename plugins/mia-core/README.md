# mia-core

MIA core plugin — sign-in, plugin lifecycle, and user/token management from the main web UI.

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

After login, the **Plugins** tab lists every installed plugin. Each card shows the plugin's data

The plugin name opens that plugin’s own screen.

On a card you can:

- view the latest GitHub tag (current tag vs last tag)
- update the plugin from GitHub
- delete the plugin

## Users

The **Users** tab lists every account. From there you can create, update, or delete accounts, and review or revoke their tokens.

Usernames never change after creation. Tokens can only be listed or deleted (not created or edited here).

## Who can do what

**Administrators**
- Create users (including admin accounts).
- Edit any user’s password and admin flag.
- Delete any user.
- List and delete any user’s tokens.

**Any signed-in user**
- See the user list.
- Edit their own password.
- Delete their own account.
- List and delete their own tokens.

Actions that do not apply to you are hidden in the interface.
