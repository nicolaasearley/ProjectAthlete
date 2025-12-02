import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutRunDto } from './dto/create-workout-run.dto';
import { UpdateWorkoutRunDto } from './dto/update-workout-run.dto';
import { WorkoutRunQueryDto } from './dto/workout-run-query.dto';

@Injectable()
export class WorkoutRunsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWorkoutRunDto: CreateWorkoutRunDto) {
    // Verify workout exists and user has access
    const workout = await this.prisma.workout.findFirst({
      where: {
        id: createWorkoutRunDto.workoutId,
        deletedAt: null,
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return this.prisma.workoutRun.create({
      data: {
        userId,
        workoutId: createWorkoutRunDto.workoutId,
        date: new Date(createWorkoutRunDto.date),
        startedAt: new Date(),
        results: createWorkoutRunDto.results ? (createWorkoutRunDto.results as any) : null,
        notes: createWorkoutRunDto.notes || null,
        totalTimeSeconds: createWorkoutRunDto.totalTimeSeconds || null,
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            exercises: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, query: WorkoutRunQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (query.workoutId) {
      where.workoutId = query.workoutId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [workoutRuns, total] = await Promise.all([
      this.prisma.workoutRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          workout: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.workoutRun.count({ where }),
    ]);

    return {
      data: workoutRuns,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const workoutRun = await this.prisma.workoutRun.findUnique({
      where: { id },
      include: {
        workout: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
        weightLogs: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!workoutRun) {
      throw new NotFoundException('Workout run not found');
    }

    if (workoutRun.userId !== userId) {
      throw new ForbiddenException('You can only view your own workout runs');
    }

    return workoutRun;
  }

  async update(id: string, userId: string, updateWorkoutRunDto: UpdateWorkoutRunDto) {
    const workoutRun = await this.prisma.workoutRun.findUnique({
      where: { id },
    });

    if (!workoutRun) {
      throw new NotFoundException('Workout run not found');
    }

    if (workoutRun.userId !== userId) {
      throw new ForbiddenException('You can only update your own workout runs');
    }

    const updateData: any = {};

    if (updateWorkoutRunDto.results !== undefined) {
      updateData.results = updateWorkoutRunDto.results ? (updateWorkoutRunDto.results as any) : null;
    }

    if (updateWorkoutRunDto.notes !== undefined) {
      updateData.notes = updateWorkoutRunDto.notes || null;
    }

    if (updateWorkoutRunDto.totalTimeSeconds !== undefined) {
      updateData.totalTimeSeconds = updateWorkoutRunDto.totalTimeSeconds || null;
    }

    if (updateWorkoutRunDto.date) {
      updateData.date = new Date(updateWorkoutRunDto.date);
    }

    // Mark as completed if results are provided
    if (updateWorkoutRunDto.results && !workoutRun.completedAt) {
      updateData.completedAt = new Date();
    }

    return this.prisma.workoutRun.update({
      where: { id },
      data: updateData,
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            exercises: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const workoutRun = await this.prisma.workoutRun.findUnique({
      where: { id },
    });

    if (!workoutRun) {
      throw new NotFoundException('Workout run not found');
    }

    if (workoutRun.userId !== userId) {
      throw new ForbiddenException('You can only delete your own workout runs');
    }

    return this.prisma.workoutRun.delete({
      where: { id },
    });
  }

  async complete(id: string, userId: string, results?: Record<string, any>, notes?: string) {
    const workoutRun = await this.prisma.workoutRun.findUnique({
      where: { id },
    });

    if (!workoutRun) {
      throw new NotFoundException('Workout run not found');
    }

    if (workoutRun.userId !== userId) {
      throw new ForbiddenException('You can only complete your own workout runs');
    }

    const updateData: any = {
      completedAt: new Date(),
    };

    if (results) {
      updateData.results = results as any;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Calculate total time if startedAt exists
    if (workoutRun.startedAt && !workoutRun.totalTimeSeconds) {
      const startTime = new Date(workoutRun.startedAt).getTime();
      const endTime = new Date().getTime();
      updateData.totalTimeSeconds = Math.floor((endTime - startTime) / 1000);
    }

    return this.prisma.workoutRun.update({
      where: { id },
      data: updateData,
      include: {
        workout: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}

