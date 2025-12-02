import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';
import { UpdateWeightLogDto } from './dto/update-weight-log.dto';
import { WeightLogQueryDto } from './dto/weight-log-query.dto';

@Injectable()
export class WeightLogsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWeightLogDto: CreateWeightLogDto) {
    // Validate exercise exists if provided
    if (createWeightLogDto.exerciseId) {
      const exercise = await this.prisma.exercise.findUnique({
        where: { id: createWeightLogDto.exerciseId },
      });
      if (!exercise) {
        throw new NotFoundException('Exercise not found');
      }
    }

    // Validate workout run exists and belongs to user if provided
    if (createWeightLogDto.workoutRunId) {
      const workoutRun = await this.prisma.workoutRun.findUnique({
        where: { id: createWeightLogDto.workoutRunId },
      });
      if (!workoutRun || workoutRun.userId !== userId) {
        throw new NotFoundException('Workout run not found');
      }
    }

    return this.prisma.weightLog.create({
      data: {
        userId,
        exerciseId: createWeightLogDto.exerciseId || null,
        workoutRunId: createWeightLogDto.workoutRunId || null,
        weight: createWeightLogDto.weight ? createWeightLogDto.weight : null,
        reps: createWeightLogDto.reps || null,
        sets: createWeightLogDto.sets || null,
        date: new Date(createWeightLogDto.date),
        notes: createWeightLogDto.notes || null,
      },
      include: {
        exercise: true,
        workoutRun: {
          include: {
            workout: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, query: WeightLogQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (query.exerciseId) {
      where.exerciseId = query.exerciseId;
    }

    if (query.workoutRunId) {
      where.workoutRunId = query.workoutRunId;
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

    const [weightLogs, total] = await Promise.all([
      this.prisma.weightLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          workoutRun: {
            include: {
              workout: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.weightLog.count({ where }),
    ]);

    return {
      data: weightLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const weightLog = await this.prisma.weightLog.findUnique({
      where: { id },
      include: {
        exercise: true,
        workoutRun: {
          include: {
            workout: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!weightLog) {
      throw new NotFoundException('Weight log not found');
    }

    if (weightLog.userId !== userId) {
      throw new ForbiddenException('You can only view your own weight logs');
    }

    return weightLog;
  }

  async update(id: string, userId: string, updateWeightLogDto: UpdateWeightLogDto) {
    const weightLog = await this.prisma.weightLog.findUnique({
      where: { id },
    });

    if (!weightLog) {
      throw new NotFoundException('Weight log not found');
    }

    if (weightLog.userId !== userId) {
      throw new ForbiddenException('You can only update your own weight logs');
    }

    return this.prisma.weightLog.update({
      where: { id },
      data: {
        ...(updateWeightLogDto.exerciseId !== undefined && {
          exerciseId: updateWeightLogDto.exerciseId || null,
        }),
        ...(updateWeightLogDto.weight !== undefined && {
          weight: updateWeightLogDto.weight || null,
        }),
        ...(updateWeightLogDto.reps !== undefined && {
          reps: updateWeightLogDto.reps || null,
        }),
        ...(updateWeightLogDto.sets !== undefined && {
          sets: updateWeightLogDto.sets || null,
        }),
        ...(updateWeightLogDto.date && {
          date: new Date(updateWeightLogDto.date),
        }),
        ...(updateWeightLogDto.notes !== undefined && {
          notes: updateWeightLogDto.notes || null,
        }),
      },
      include: {
        exercise: true,
        workoutRun: {
          include: {
            workout: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const weightLog = await this.prisma.weightLog.findUnique({
      where: { id },
    });

    if (!weightLog) {
      throw new NotFoundException('Weight log not found');
    }

    if (weightLog.userId !== userId) {
      throw new ForbiddenException('You can only delete your own weight logs');
    }

    return this.prisma.weightLog.delete({
      where: { id },
    });
  }

  // Get weight progression for an exercise
  async getExerciseProgression(userId: string, exerciseId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      userId,
      exerciseId,
      weight: { not: null },
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    return this.prisma.weightLog.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        weight: true,
        reps: true,
        sets: true,
        date: true,
      },
    });
  }
}

