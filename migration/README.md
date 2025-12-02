# Workout Migration Script

This script migrates workouts from the old SQLite database to the new PostgreSQL database.

## Overview

The migration script:
- Extracts workouts from `Old_Site/instance/workouts.db`
- Converts exercise groups to the new `groupType`/`groupIndex` system
- Imports workouts as COMMUNITY templates (no owner)
- Preserves all exercise details (sets, reps, weight, tempo, rest, notes)

## Prerequisites

1. The old database file must exist at `../Old_Site/instance/workouts.db` (or set `OLD_DB_PATH` env var)
2. The new PostgreSQL database must be running and accessible via `DATABASE_URL` in `../../.env`
3. Node.js dependencies must be installed

## Usage

### Install Dependencies

```bash
cd migration
npm install
```

### Dry Run (Preview Changes)

```bash
./RUN_WORKOUT_MIGRATION.sh --dry-run
```

This will show what would be migrated without making any changes to the database.

### Run Migration

```bash
./RUN_WORKOUT_MIGRATION.sh
```

Or manually:

```bash
npm run migrate
```

## How It Works

### Data Transformation

1. **Workouts**: Converted to COMMUNITY type templates
   - Original date is included in description
   - Duplicate titles get date suffix

2. **Exercise Groups**: Converted to grouping system
   - Groups with "WOD", "Circuit", "Round" → `CIRCUIT` type
   - Other groups → `SUPERSET` type
   - Exercises in same group get same `groupIndex`

3. **Exercises**: All fields preserved
   - Exercise name, sets, reps, weight, tempo, rest, notes
   - Group information added to notes if applicable

### Group Type Detection

- **CIRCUIT**: Group names containing "wod", "circuit", "round", "rounds"
- **SUPERSET**: All other groups

## Output

The script provides:
- Progress for each workout processed
- Summary statistics (total, migrated, skipped, errors)
- Error messages for any failures

## Troubleshooting

### ts-node Command Not Found / Symlink Issues (Linux)

If you get errors like `XSym: command not found` or `ts-node: No such file or directory`, this usually means `node_modules` were installed on a different system (like macOS) and the symlinks don't work on Linux.

**Solution**: Reinstall dependencies on the Linux server:
```bash
./REINSTALL_DEPS.sh
```

Or manually:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

Ensure `DATABASE_URL` is set correctly in `../../.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_earley"
```

### Old Database Not Found

Set the `OLD_DB_PATH` environment variable:
```bash
export OLD_DB_PATH=/path/to/old/database.db
./RUN_WORKOUT_MIGRATION.sh
```

### Duplicate Workout Titles

If a workout title already exists, the script automatically adds the original date as a suffix:
- Original: "Push Day"
- If duplicate: "Push Day (2024-01-15)"

## Safety

- The script is idempotent (can be run multiple times)
- Use `--dry-run` to preview changes first
- Each workout is processed independently (errors won't stop the migration)

