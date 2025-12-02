import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExerciseQueryDto } from './dto/exercise-query.dto';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async create(createExerciseDto: CreateExerciseDto) {
    // Check if exercise with same name already exists
    const existing = await this.prisma.exercise.findUnique({
      where: { name: createExerciseDto.name },
    });

    if (existing) {
      throw new ConflictException('Exercise with this name already exists');
    }

    return this.prisma.exercise.create({
      data: {
        name: createExerciseDto.name,
        description: createExerciseDto.description || null,
        category: createExerciseDto.category || null,
        defaultMetrics: createExerciseDto.defaultMetrics ? (createExerciseDto.defaultMetrics as any) : null,
      },
    });
  }

  async findAll(query: ExerciseQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      data: exercises,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            weightLogs: true,
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async update(id: string, updateExerciseDto: UpdateExerciseDto) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Check if name is being changed and if new name already exists
    if (updateExerciseDto.name && updateExerciseDto.name !== exercise.name) {
      const existing = await this.prisma.exercise.findUnique({
        where: { name: updateExerciseDto.name },
      });

      if (existing) {
        throw new ConflictException('Exercise with this name already exists');
      }
    }

    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...(updateExerciseDto.name && { name: updateExerciseDto.name }),
        ...(updateExerciseDto.description !== undefined && {
          description: updateExerciseDto.description || null,
        }),
        ...(updateExerciseDto.category !== undefined && {
          category: updateExerciseDto.category || null,
        }),
        ...(updateExerciseDto.defaultMetrics !== undefined && {
          defaultMetrics: updateExerciseDto.defaultMetrics ? (updateExerciseDto.defaultMetrics as any) : null,
        }),
      },
    });
  }

  async remove(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Check if exercise has weight logs
    const weightLogCount = await this.prisma.weightLog.count({
      where: { exerciseId: id },
    });

    if (weightLogCount > 0) {
      throw new ConflictException(
        `Cannot delete exercise with ${weightLogCount} weight log(s). Consider updating the exercise instead.`,
      );
    }

    return this.prisma.exercise.delete({
      where: { id },
    });
  }

  async getCategories() {
    const exercises = await this.prisma.exercise.findMany({
      select: { category: true },
      where: {
        category: { not: null },
      },
    });

    const categories = [...new Set(exercises.map((e) => e.category).filter(Boolean))];
    return categories.sort();
  }
}

