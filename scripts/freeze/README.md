# Freeze tools — snapshot, wipe, restore

Three scripts for freezing the project: take a full backup outside Supabase, empty the business
data in one step, and bring every row back one-to-one in one step.

The project has **one** database (`yfeovxppnfoafmfbdfvh`) and it serves the live site. Every
command below runs against it.

## Order

```
npm run freeze:snapshot                                  # 1. backup (read-only)
npm run freeze:restore -- --from=<dir>                   # 2. prove the backup restores (safe)
npm run freeze:wipe -- --dry-run                         # 3. see what would be deleted
npm run freeze:wipe                                      # 4. delete (asks for a typed phrase)
npm run freeze:restore -- --from=<dir> --apply           # later: bring everything back
```

## What each one does

| Command | Touches the DB? | What it does |
|---|---|---|
| `freeze:snapshot [-- --out=<dir>]` | read-only | Copies every `public` and `seed_snapshot` table, `auth.users` + `auth.identities`, sequence values and all storage files to `%OneDrive%\REGIN\freeze-snapshots\<YYYYMMDD-HHMM>\`. Writes `manifest.json` **last**, with the row count, an md5 computed in SQL, and a sha256 per file. |
| `freeze:restore -- --from=<dir>` (default `--verify-only`) | temporary schema only | Loads the snapshot into `freeze_restore_test`, recomputes the md5 per table, compares it with the manifest, and always drops the schema. Exit 0 = the snapshot restores one-to-one. |
| `freeze:wipe [-- --dry-run]` | **deletes** | `TRUNCATE` of every `public` table except the KEEP list in `lib.mjs` (users, roles, permissions, config, product catalog — each with its reason). Never touches schema, functions, `auth`, `storage` or `seed_snapshot`. |
| `freeze:restore -- --from=<dir> --apply` | **overwrites** | Replica mode (no trigger fires: no mail, no audit rows), truncates the wiped set, inserts in chunks, keeps identity values, restores sequences, adds missing auth users and storage files, then checks md5 against the manifest. |

## Guards

- **Wipe** refuses unless all of these hold:
  - a snapshot from the last 24 h has a `manifest.json` and all of its files present with a matching sha256;
  - the live row counts of all `public` tables equal the manifest;
  - the md5 of every table about to be wiped equals the manifest;
  - every table about to be wiped is in the snapshot.

  It then asks you to type `מחק את כל הנתונים` exactly.
- **Restore `--apply`** asks you to type `החזר את כל הנתונים` exactly. It refuses if the schema
  version changed since the snapshot, unless you pass `--allow-schema-drift`.
- **Restore `--apply` on a database that still has data** first needs the same fresh-snapshot
  guard as wipe: a snapshot from the last 24 hours that matches the live data. Otherwise everything
  created since the snapshot you restore from would vanish. So the order is `freeze:snapshot`, then
  `freeze:restore --from=<older snapshot> --apply`. On a wiped database (the wiped set is empty)
  there is nothing to lose, and the guard is skipped.
- **Sequences** are reset only for the tables that are restored. Kept tables (`params`, `roles`…)
  keep their live counters, so a new row there never collides with an existing id.
- The phrase is read from stdin, so it can also be piped in. Anything else exits without touching
  the database.

## If something fails halfway

- **Snapshot:** the folder has no `manifest.json`. Wipe and restore ignore it, so it is not a
  backup. Take a new snapshot. You may delete the half folder.
- **Restore `--apply`:** each API call is its own transaction, so some tables may be filled and
  others empty. Run the same `--apply` command again. It starts by truncating the whole wiped set,
  so a rerun starts clean and never duplicates rows. While a restore is running, the snapshot folder
  holds `restore-in-progress.json`; when it is there, the rerun skips the fresh-snapshot guard (the
  live data is a partial copy of that same snapshot). The file is removed when the restore succeeds.
- **Exit codes:**
  - `0` — OK.
  - `1` — failure or mismatch.
  - `2` — the typed phrase did not match.
  - `3` — the restore is OK, but a table that is not restored (KEEP or `seed_snapshot`) changed since the snapshot.

## Where snapshots live — and where they must never go

Snapshots hold password hashes and bank-like demo data. They live **only** outside the repo
(default `%OneDrive%\REGIN\freeze-snapshots`). The repo is public: never copy a snapshot into it.

## Requirements

`.env.local` with `SUPABASE_ACCESS_TOKEN` (a Supabase personal access token) and
`VITE_SUPABASE_URL`. The service-role key for storage is fetched at runtime and kept in memory
only. No token or key is ever printed or written to disk.
