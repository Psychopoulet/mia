# Application database (Sequelize)

Step-by-step plan. Finish one step fully before starting the next. Do not skip ahead (the Winston transport needs a live Sequelize instance and a Log model).

Mark a step title with ✓ when it is done.

## Context

Application database managed **entirely with Sequelize**. No Mongoose, no native MongoDB driver, no second ORM.

Sequelize is SQL-only. Default backend: **local SQLite**. Optional ConfManager URI: any Sequelize SQL dialect (`sqlite`, `postgres`, `mysql`, `mariadb`, `mssql`). A `mongodb://` URI must fail `authenticate()` and reject `generateDatabase`.

`AuthDatabase` (`better-sqlite3`) stays as it is.

### Target init chain

```text
generateConf
  → generateDatabase          # Step 4
  → generateLogger            # Step 7 (adds Sequelize transport)
  → generateAuthDatabase
  → log paths                 # Step 5
  → managePlugins
  → generateServer
  → SIGINT/SIGTERM: plugins → database.close() → auth-db.close() → exit
```

`generateDatabase` uses the bootstrap console logger. `generateLogger` then replaces it with Winston and can add the Sequelize transport immediately.

### Constraints (all steps)

- Sequelize **6.37.8** only (not v7 alpha).
- SQLite via existing `better-sqlite3` (`dialectModule`). Do not add `sqlite3`.
- `logging: false` on every Sequelize instance (avoids a log loop once Winston writes to SQL).
- `sync()` without `alter` or `force`.
- Do not add `winston-sequelize` or `winston-sql-transport`.
- Do not add `pg` / `mysql2` / etc. until a non-SQLite dialect is actually used.
- Match existing code style (`generateAuthDatabase`, quoted object keys, promise chains).

---

## Step 1 — Dependencies ✓

**Goal:** Install the libraries. No application code yet.

**Files:** `package.json` (via npm).

**Work:**

- Add `sequelize@6.37.8`.
- Add `winston-transport` (same major as Winston’s nested dependency) so `check-requires` sees a direct import later.
- Types ship with Sequelize 6: no `@types/sequelize`.

**Done when:** `package.json` lists both packages; `npm install` succeeds.

---

## Step 2 — Container keys ✓

**Goal:** Document paths and the future Sequelize instance on the container.

**Files:** `lib/src/tools/init/registerAppData.ts`

**Work:** Same pattern as `auth-file` / `auth-db`:

| Key | Type | Meaning |
|---|---|---|
| `database-file` | `string` | `join(data-directory, "mia-database.db")` |
| `database` | `Sequelize` | Document only; instance is set in Step 4 |

**Done when:** `database-file` is set and both keys are documented. App still boots as before.

---

## Step 3 — ConfManager URI ✓

**Goal:** Optional `database-uri` in conf (console / env / `.env`).

**Files:** `lib/src/tools/init/generateConf.ts`

**Work:** Same pattern as `port` / `debug`:

- `skeleton("database-uri", "string")`
- `document("database-uri", "URI of the application database. Empty or unset uses local SQLite.")`

Do **not** write a default into `.env`. Treat as unset when `!conf.has("database-uri")` or the value is `""`. Env name follows ConfManager’s usual mapping (`DATABASE-URI` / `DATABASE_URI` — match how `port` and `debug` are loaded).

**Done when:** The key is skeletoned and documented. Unset conf still means “use local SQLite” in later steps.

---

## Step 4 — Log model + `generateDatabase` + boot wiring

**Goal:** Open Sequelize, create/sync the `logs` table, store the instance, call this **before** `generateLogger`.

**Files (new):**

- `lib/src/tools/models/Log.ts`
- `lib/src/tools/init/generateDatabase.ts`

**Files (edit):** `lib/src/main.cts`

### 4a. Log model

Table name: `logs`. Register on the Sequelize instance **before** `sync()`.

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER`, PK, auto-increment | |
| `level` | `STRING` | Winston level name |
| `message` | `TEXT` | |
| `timestamp` | `DATE` | |
| `meta` | `JSON` | Optional extra fields |

### 4b. `generateDatabase`

Signature like `generateAuthDatabase`:  
`export default function generateDatabase (container: ContainerPattern): Promise<void>`.

Algorithm:

1. Read `conf.get("database-uri")`.
2. **Unset / empty**
   - `new Sequelize({ dialect: "sqlite", storage: database-file, dialectModule: better-sqlite3, logging: false })`.
   - If the file does not exist (`isFile`, same helper as auth): log `info` (“database not detected, create one at …”).
   - Register Log, `authenticate()`, `sync()`.
3. **Set**
   - `new Sequelize(uri, { logging: false })`.
   - `authenticate()`. On failure: **reject**, no SQLite fallback.
   - Register Log, `sync()`.
4. `container.set("database", sequelize)`.

Use `container.get<iLogger>("log")` (bootstrap console).

### 4c. `main.cts`

- Import `generateDatabase`.
- Insert `.then(() => generateDatabase(container))` **between** `generateConf` and `generateLogger`.

**Done when:** App starts, `mia-database.db` appears under `data-directory` when URI is empty, `container.has("database")` is true after init, and a bad URI aborts startup.

---

## Step 5 — Shutdown + startup logs

**Goal:** Close Sequelize like auth; print the database path/URI after Winston exists.

**Files:** `lib/src/main.cts`

**Work:**

1. In the existing “log basic data” step (after logger + auth db): log `database-file` and the ConfManager URI when set.
2. In `_handleKill`, after plugins `releaseAll` / `destroyAll`, if `container.has("database")`:

   ```text
   return container.get<Sequelize>("database").close()
   ```

   then `auth-db.close()`.

`Sequelize#close()` returns a Promise; keep the kill chain. Guard with `has("database")`.

**Done when:** SIGINT/SIGTERM closes the SQL connection without error; startup logs show the SQLite path (and URI if set).

---

## Step 6 — Winston Sequelize transport

**Goal:** Custom transport only. Do not wire it into `generateLogger` yet.

**Files (new):** `lib/src/tools/WinstonSequelizeTransport.ts`

**Work:**

- Extend `Transport` from `winston-transport`.
- Options: Log model (or Sequelize instance) + `level` (`debug` vs `info`, same as File).
- `log(info, callback)`: `Log.create({ level, message, timestamp, meta })` then `callback()`.
- On insert failure: `this.emit("error", err)` and still `callback()` (do not hang Winston).
- Do not call the Winston logger from inside `log()`.
- `meta` = `info` minus `level` / `message` / `timestamp`.

**Done when:** The class compiles. Logging still File + Console only.

---

## Step 7 — Attach transport in `generateLogger`

**Goal:** Persist logs to SQL as well as file (and console in debug).

**Files:** `lib/src/tools/init/generateLogger.ts`

**Work:** `generateDatabase` has already run. Add the transport to the initial `transports` array:

```ts
new WinstonSequelizeTransport({
    "level": conf.get<boolean>("debug") ? "debug" : "info",
    "model": Log
})
```

File and Console stay. SQL is an extra destination, not a replacement.

Bootstrap console logs **before** this step (including database creation) never go to SQL.

**Done when:** After boot, a Winston `info` (or `debug`) row exists in the `logs` table; `logs.txt` still receives the same line.

---

## Out of scope

- MongoDB / Mongoose / `winston-mongodb`
- Moving `AuthDatabase` to Sequelize
- `docker-compose` for SQL/Mongo
- Sequelize 7
- Extra SQL drivers until a non-SQLite URI is actually used
- Replacing the File transport
