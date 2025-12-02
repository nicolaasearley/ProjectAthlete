#!/usr/bin/env node

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
// Import Prisma Client from root node_modules where it's generated
import { PrismaClient } from '../../node_modules/@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from root directory
const rootPath = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(rootPath, '.env') });
dotenv.config({ path: path.join(rootPath, '.env.local') });

// Interface definitions for old database structure
interface OldWorkout {
  id: number;
  workout_name: string;
  date: string;
  created_by: number;
  created_at: string;
}

interface OldExerciseGroup {
  id: number;
  workout_id: number;
  order: number;
  group_name: string | null;
  rounds: string | null;
  rep_scheme: string | null;
  notes: string | null;
}

interface OldExercise {
  id: number;
  workout_id: number;
  group_id: number | null;
  order: number;
  exercise_name: string;
  sets: string | null;
  reps: string | null;
  weight: string | null;
  tempo: string | null;
  rest: string | null;
  notes: string | null;
}

interface NewExercise {
  id: string;
  name: string;
  order: number;
  sets?: string;
  reps?: string;
  weight?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  groupType?: 'SUPERSET' | 'CIRCUIT';
  groupIndex?: number;
}

// Determine group type based on group name
function determineGroupType(groupName: string | null): 'SUPERSET' | 'CIRCUIT' {
  if (!groupName) return 'SUPERSET';
  const lowerName = groupName.toLowerCase();
  if (lowerName.includes('wod') || lowerName.includes('circuit') || 
      lowerName.includes('round') || lowerName.includes('rounds')) {
    return 'CIRCUIT';
  }
  return 'SUPERSET';
}

// Main migration function
async function migrateWorkouts(dryRun: boolean = false) {
  const oldDbPath = process.env.OLD_DB_PATH || path.join(rootPath, 'Old_Site', 'instance', 'workouts.db');
  
  if (!fs.existsSync(oldDbPath)) {
    console.error(`❌ Old database not found at: ${oldDbPath}`);
    process.exit(1);
  }

  console.log(`📂 Opening old database: ${oldDbPath}`);
  const SQL = await initSqlJs();
  const dbBuffer = fs.readFileSync(oldDbPath);
  const oldDb = new SQL.Database(dbBuffer);

  // Initialize Prisma Client
  const prisma = new PrismaClient();

  try {
    // Extract all workouts
    console.log('\n📊 Extracting workouts from old database...');
    const workoutsResult = oldDb.exec(`
      SELECT id, workout_name, date, created_by, created_at
      FROM workout
      ORDER BY date DESC
    `);
    const oldWorkouts: OldWorkout[] = workoutsResult[0]?.values.map((row: any[]) => ({
      id: row[0],
      workout_name: row[1],
      date: row[2],
      created_by: row[3],
      created_at: row[4],
    })) || [];

    console.log(`   Found ${oldWorkouts.length} workouts`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made to the database\n');
    }

    const stats = {
      total: oldWorkouts.length,
      migrated: 0,
      skipped: 0,
      errors: 0,
    };

    for (const oldWorkout of oldWorkouts) {
      try {
        console.log(`\n🔄 Processing: "${oldWorkout.workout_name}" (ID: ${oldWorkout.id})`);

        // Extract exercise groups for this workout
        const groupsStmt = oldDb.prepare(`
          SELECT id, group_name, rounds, rep_scheme, notes, "order"
          FROM exercise_group
          WHERE workout_id = ?
          ORDER BY "order"
        `);
        groupsStmt.bind([oldWorkout.id]);
        const exerciseGroups: OldExerciseGroup[] = [];
        while (groupsStmt.step()) {
          const row = groupsStmt.getAsObject();
          exerciseGroups.push({
            id: row.id as number,
            workout_id: oldWorkout.id,
            order: row.order as number,
            group_name: row.group_name as string | null,
            rounds: row.rounds as string | null,
            rep_scheme: row.rep_scheme as string | null,
            notes: row.notes as string | null,
          });
        }
        groupsStmt.free();

        // Extract exercises for this workout
        const exercisesStmt = oldDb.prepare(`
          SELECT id, exercise_name, sets, reps, weight, tempo, rest, notes, group_id, "order"
          FROM exercise
          WHERE workout_id = ?
          ORDER BY "order"
        `);
        exercisesStmt.bind([oldWorkout.id]);
        const exercises: OldExercise[] = [];
        while (exercisesStmt.step()) {
          const row = exercisesStmt.getAsObject();
          exercises.push({
            id: row.id as number,
            workout_id: oldWorkout.id,
            group_id: row.group_id as number | null,
            order: row.order as number,
            exercise_name: row.exercise_name as string,
            sets: row.sets as string | null,
            reps: row.reps as string | null,
            weight: row.weight as string | null,
            tempo: row.tempo as string | null,
            rest: row.rest as string | null,
            notes: row.notes as string | null,
          });
        }
        exercisesStmt.free();

        if (exercises.length === 0) {
          console.log(`   ⚠️  Skipping: No exercises found`);
          stats.skipped++;
          continue;
        }

        console.log(`   Found ${exerciseGroups.length} groups and ${exercises.length} exercises`);

        // Create a map of group_id -> groupIndex
        const groupIndexMap = new Map<number, number>();
        let nextGroupIndex = 0;

        // Assign group indices
        for (const group of exerciseGroups.sort((a, b) => a.order - b.order)) {
          if (!groupIndexMap.has(group.id)) {
            groupIndexMap.set(group.id, nextGroupIndex++);
          }
        }

        // Transform exercises to new format
        const newExercises: NewExercise[] = exercises.map((oldEx) => {
          const newEx: NewExercise = {
            id: uuidv4(),
            name: oldEx.exercise_name,
            order: oldEx.order,
            sets: oldEx.sets || undefined,
            reps: oldEx.reps || undefined,
            weight: oldEx.weight || undefined,
            tempo: oldEx.tempo || undefined,
            rest: oldEx.rest || undefined,
            notes: oldEx.notes || undefined,
          };

          // If exercise belongs to a group, add grouping info
          if (oldEx.group_id !== null) {
            const group = exerciseGroups.find(g => g.id === oldEx.group_id);
            if (group) {
              newEx.groupType = determineGroupType(group.group_name);
              newEx.groupIndex = groupIndexMap.get(oldEx.group_id);

              // Add group info to notes if available
              if (group.rounds || group.rep_scheme || group.notes) {
                const groupInfo = [
                  group.group_name && `Group: ${group.group_name}`,
                  group.rounds && `Rounds: ${group.rounds}`,
                  group.rep_scheme && `Rep Scheme: ${group.rep_scheme}`,
                  group.notes && group.notes,
                ].filter(Boolean).join(' | ');

                if (newEx.notes) {
                  newEx.notes = `${groupInfo}\n${newEx.notes}`;
                } else {
                  newEx.notes = groupInfo;
                }
              }
            }
          }

          return newEx;
        });

        // Create workout description
        const description = `Migrated from old site. Original date: ${oldWorkout.date}`;

        // Check for duplicate titles (skip in dry-run mode)
        let workoutTitle = oldWorkout.workout_name;
        if (!dryRun) {
          const existingWorkout = await prisma.workout.findFirst({
            where: { title: oldWorkout.workout_name },
          });
          
          if (existingWorkout) {
            workoutTitle = `${oldWorkout.workout_name} (${oldWorkout.date})`;
            console.log(`   ⚠️  Duplicate title found, using: "${workoutTitle}"`);
          }
        }

        if (dryRun) {
          console.log(`   ✅ Would create workout: "${workoutTitle}"`);
          console.log(`      Type: COMMUNITY`);
          console.log(`      Exercises: ${newExercises.length}`);
          console.log(`      Grouped exercises: ${newExercises.filter(e => e.groupIndex !== undefined).length}`);
          stats.migrated++;
        } else {
          // Create workout in new database
          const newWorkout = await prisma.workout.create({
            data: {
              title: workoutTitle,
              description: description,
              type: 'COMMUNITY',
              exercises: newExercises as any, // Prisma expects JSON
              ownerUserId: null, // COMMUNITY workouts have no owner
              isTemplate: true,
            },
          });

          console.log(`   ✅ Created workout: "${newWorkout.title}" (ID: ${newWorkout.id})`);
          stats.migrated++;
        }

      } catch (error: any) {
        console.error(`   ❌ Error processing workout "${oldWorkout.workout_name}":`, error.message);
        stats.errors++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total workouts:     ${stats.total}`);
    console.log(`✅ Migrated:        ${stats.migrated}`);
    console.log(`⚠️  Skipped:         ${stats.skipped}`);
    console.log(`❌ Errors:          ${stats.errors}`);
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n🔍 This was a DRY RUN - no changes were made');
      console.log('   Run without --dry-run to perform the actual migration');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
migrateWorkouts(dryRun)
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

