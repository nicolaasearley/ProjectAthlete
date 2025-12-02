import { PrismaClient, Role, WorkoutType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitnessearley.com' },
    update: {},
    create: {
      email: 'admin@fitnessearley.com',
      passwordHash: adminPassword,
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create default coach user
  const coachPassword = await bcrypt.hash('coach123', 10);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@fitnessearley.com' },
    update: {},
    create: {
      email: 'coach@fitnessearley.com',
      passwordHash: coachPassword,
      displayName: 'Coach User',
      firstName: 'Coach',
      lastName: 'User',
      role: Role.COACH,
      emailVerified: true,
    },
  });

  console.log('Created coach user:', coach.email);

  // Create sample exercise
  const benchPress = await prisma.exercise.upsert({
    where: { name: 'Bench Press' },
    update: {},
    create: {
      name: 'Bench Press',
      description: 'Barbell bench press exercise',
      category: 'STRENGTH',
      defaultMetrics: {
        primary: 'weight',
        supports: ['weight', 'reps', 'sets'],
        units: {
          weight: 'lbs',
          reps: 'reps',
        },
      },
    },
  });

  console.log('Created exercise:', benchPress.name);

  // Create sample community workout
  const sampleWorkout = await prisma.workout.create({
    data: {
      ownerUserId: coach.id,
      title: 'Sample Push Day',
      description: 'A sample community workout for push day',
      type: WorkoutType.COMMUNITY,
      exercises: [
        {
          id: 'ex1',
          name: 'Bench Press',
          order: 1,
          sets: '5',
          reps: '5',
          weight: '225',
          tempo: '3-0-1',
          rest: '180s',
          notes: 'Focus on form',
        },
        {
          id: 'ex2',
          name: 'Overhead Press',
          order: 2,
          sets: '5',
          reps: '5',
          weight: '135',
          tempo: '3-1-1',
          rest: '180s',
          notes: 'Full range of motion',
        },
      ],
      estimatedTimeMinutes: 60,
      tags: ['push', 'chest', 'shoulders'],
      notes: 'A great push workout for building upper body strength',
      isTemplate: true,
    },
  });

  console.log('Created sample workout:', sampleWorkout.title);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
