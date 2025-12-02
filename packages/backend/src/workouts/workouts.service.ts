import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutQueryDto } from './dto/workout-query.dto';
import { WorkoutType, Role } from '../common/types/enums';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWorkoutDto: CreateWorkoutDto) {
    return this.prisma.workout.create({
      data: {
        ownerUserId: userId,
        title: createWorkoutDto.title,
        description: createWorkoutDto.description,
        type: createWorkoutDto.type,
        exercises: createWorkoutDto.exercises as any,
        estimatedTimeMinutes: createWorkoutDto.estimatedTimeMinutes,
        tags: createWorkoutDto.tags || [],
        notes: createWorkoutDto.notes,
        isTemplate: createWorkoutDto.isTemplate || false,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, query: WorkoutQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Filter by type
    if (query.type) {
      where.type = query.type;
    }

    // Filter by owner
    if (query.ownerId) {
      where.ownerUserId = query.ownerId;
    } else {
      // If no ownerId specified, show user's personal workouts and all community workouts
      where.OR = [
        { ownerUserId: userId },
        { type: WorkoutType.COMMUNITY },
      ];
    }

    // Search filter - combine with existing OR conditions
    if (query.search) {
      const searchConditions = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];

      // If we already have an OR clause, wrap both in AND
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [workouts, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.workout.count({ where }),
    ]);

    return {
      data: workouts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { ownerUserId: userId },
          { type: WorkoutType.COMMUNITY },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }

  async update(id: string, userId: string, updateWorkoutDto: UpdateWorkoutDto) {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
    });

    if (!workout || workout.deletedAt) {
      throw new NotFoundException('Workout not found');
    }

    // Check if user is owner, or if user is admin/coach and workout is COMMUNITY
    const isOwner = workout.ownerUserId === userId;
    const isCommunityWorkout = workout.type === WorkoutType.COMMUNITY;

    if (!isOwner) {
      // If not owner, check if user is admin/coach and workout is COMMUNITY
      if (!isCommunityWorkout) {
        throw new ForbiddenException('You can only update your own workouts');
      }

      // For COMMUNITY workouts, allow admins and coaches to edit
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || (user.role !== Role.ADMIN && user.role !== Role.COACH)) {
        throw new ForbiddenException('Only admins and coaches can edit community workouts');
      }
    }

    return this.prisma.workout.update({
      where: { id },
      data: {
        ...(updateWorkoutDto as any),
        exercises: updateWorkoutDto.exercises 
          ? (updateWorkoutDto.exercises as any) 
          : workout.exercises,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
    });

    if (!workout || workout.deletedAt) {
      throw new NotFoundException('Workout not found');
    }

    // Check if user is owner, or if user is admin/coach and workout is COMMUNITY
    const isOwner = workout.ownerUserId === userId;
    const isCommunityWorkout = workout.type === WorkoutType.COMMUNITY;

    if (!isOwner) {
      // If not owner, check if user is admin/coach and workout is COMMUNITY
      if (!isCommunityWorkout) {
        throw new ForbiddenException('You can only delete your own workouts');
      }

      // For COMMUNITY workouts, allow admins and coaches to delete
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || (user.role !== Role.ADMIN && user.role !== Role.COACH)) {
        throw new ForbiddenException('Only admins and coaches can delete community workouts');
      }
    }

    // Soft delete
    return this.prisma.workout.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async copy(id: string, userId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: {
        id,
        deletedAt: null,
        type: WorkoutType.COMMUNITY,
      },
    });

    if (!workout) {
      throw new NotFoundException('Community workout not found');
    }

    return this.prisma.workout.create({
      data: {
        ownerUserId: userId,
        title: `${workout.title} (Copy)`,
        description: workout.description,
        type: WorkoutType.PERSONAL,
        exercises: workout.exercises as any,
        estimatedTimeMinutes: workout.estimatedTimeMinutes,
        tags: workout.tags,
        notes: workout.notes,
        isTemplate: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }
}

