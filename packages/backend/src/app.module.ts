import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { WeightLogsModule } from './weight-logs/weight-logs.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutRunsModule } from './workout-runs/workout-runs.module';
import { UsersModule } from './users/users.module';
import { ChallengesModule } from './challenges/challenges.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ReactionsModule } from './reactions/reactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
      // Using in-memory storage for now (default)
      // TODO: Implement Redis storage adapter later if needed
    }),
    HealthModule,
    AuthModule,
    WorkoutsModule,
    WeightLogsModule,
    ExercisesModule,
    WorkoutRunsModule,
    UsersModule,
    ChallengesModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    NotificationsModule,
    MediaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
