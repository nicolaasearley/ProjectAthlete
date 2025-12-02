import { Module } from '@nestjs/common';
import { WorkoutRunsService } from './workout-runs.service';
import { WorkoutRunsController } from './workout-runs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkoutRunsController],
  providers: [WorkoutRunsService],
  exports: [WorkoutRunsService],
})
export class WorkoutRunsModule {}

