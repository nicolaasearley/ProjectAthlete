import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeEntryDto } from './dto/create-challenge-entry.dto';
import { Role } from '../common/types/enums';
import { parseDateString, normalizeToDateOnly } from '../common/utils/date.utils';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createChallengeDto: CreateChallengeDto) {
    // Verify user is coach or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== Role.COACH && user.role !== Role.ADMIN)) {
      throw new ForbiddenException('Only coaches and admins can create challenges');
    }

    // Validate date range
    const startAt = new Date(createChallengeDto.startAt);
    const endAt = new Date(createChallengeDto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.challenge.create({
      data: {
        coachId: userId,
        title: createChallengeDto.title,
        description: createChallengeDto.description || null,
        metricType: createChallengeDto.metricType,
        startAt,
        endAt,
        targetValue: createChallengeDto.targetValue ? createChallengeDto.targetValue : null,
        isActive: createChallengeDto.isActive !== undefined ? createChallengeDto.isActive : true,
      },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });
  }

  async findAll(query: ChallengeQueryDto) {
    const where: any = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.challenge.findMany({
      where,
      orderBy: { startAt: 'desc' },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        coach: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async update(id: string, userId: string, updateChallengeDto: UpdateChallengeDto) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Verify user is coach who created challenge or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (challenge.coachId !== userId && user.role !== Role.ADMIN)) {
      throw new ForbiddenException('You can only update challenges you created');
    }

    const updateData: any = {};

    if (updateChallengeDto.title) {
      updateData.title = updateChallengeDto.title;
    }

    if (updateChallengeDto.description !== undefined) {
      updateData.description = updateChallengeDto.description || null;
    }

    if (updateChallengeDto.metricType) {
      updateData.metricType = updateChallengeDto.metricType;
    }

    if (updateChallengeDto.startAt) {
      updateData.startAt = new Date(updateChallengeDto.startAt);
    }

    if (updateChallengeDto.endAt) {
      updateData.endAt = new Date(updateChallengeDto.endAt);
    }

    if (updateChallengeDto.targetValue !== undefined) {
      updateData.targetValue = updateChallengeDto.targetValue || null;
    }

    if (updateChallengeDto.isActive !== undefined) {
      updateData.isActive = updateChallengeDto.isActive;
    }

    // Validate date range if dates are being updated
    if (updateData.startAt || updateData.endAt) {
      const startAt = updateData.startAt || challenge.startAt;
      const endAt = updateData.endAt || challenge.endAt;
      if (endAt <= startAt) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    return this.prisma.challenge.update({
      where: { id },
      data: updateData,
      include: {
        coach: {
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
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Verify user is coach who created challenge or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (challenge.coachId !== userId && user.role !== Role.ADMIN)) {
      throw new ForbiddenException('You can only delete challenges you created');
    }

    return this.prisma.challenge.delete({
      where: { id },
    });
  }

  async createEntry(userId: string, createEntryDto: CreateChallengeEntryDto) {
    // Verify challenge exists and is active
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: createEntryDto.challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (!challenge.isActive) {
      throw new BadRequestException('Challenge is not active');
    }

    // Verify date is within challenge range
    // Parse date string to local date (avoids timezone issues)
    let entryDate: Date;
    try {
      entryDate = normalizeToDateOnly(parseDateString(createEntryDto.date));
    } catch (error) {
      throw new BadRequestException(`Invalid date format: ${createEntryDto.date}`);
    }
    
    // Normalize challenge dates for comparison
    const challengeStart = normalizeToDateOnly(new Date(challenge.startAt));
    const challengeEnd = normalizeToDateOnly(new Date(challenge.endAt));
    
    if (entryDate < challengeStart || entryDate > challengeEnd) {
      throw new BadRequestException('Entry date must be within challenge date range');
    }

    // Note: Removed unique constraint check - users can now create multiple entries per day
    // Entries will be consolidated in the leaderboard calculation

    try {
      return await this.prisma.challengeEntry.create({
        data: {
          challengeId: createEntryDto.challengeId,
          userId,
          value: createEntryDto.value,
          date: entryDate,
          notes: createEntryDto.notes || null,
        },
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              metricType: true,
            },
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating challenge entry:', error);
      if (error.code === 'P2002') {
        throw new BadRequestException('An entry already exists for this date');
      }
      throw new BadRequestException(`Failed to create entry: ${error.message || 'Unknown error'}`);
    }
  }

  async getEntries(challengeId: string, userId?: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const where: any = {
      challengeId,
    };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.challengeEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getLeaderboard(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Get all entries for this challenge
    const entries = await this.prisma.challengeEntry.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Aggregate by user
    const userTotals = new Map<string, { user: any; total: number; entryCount: number }>();

    entries.forEach((entry) => {
      const userId = entry.userId;
      const current = userTotals.get(userId) || {
        user: entry.user,
        total: 0,
        entryCount: 0,
      };
      current.total += Number(entry.value);
      current.entryCount += 1;
      userTotals.set(userId, current);
    });

    // Convert to array and sort
    const leaderboard = Array.from(userTotals.values())
      .map((item) => ({
        userId: item.user.id,
        displayName: item.user.displayName || item.user.email,
        total: item.total,
        entryCount: item.entryCount,
      }))
      .sort((a, b) => b.total - a.total);

    return leaderboard;
  }

  async updateEntry(entryId: string, userId: string, value: number, notes?: string) {
    const entry = await this.prisma.challengeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Challenge entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only update your own entries');
    }

    return this.prisma.challengeEntry.update({
      where: { id: entryId },
      data: {
        value,
        notes: notes !== undefined ? notes : entry.notes,
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            metricType: true,
          },
        },
      },
    });
  }

  async deleteEntry(entryId: string, userId: string) {
    const entry = await this.prisma.challengeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Challenge entry not found');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only delete your own entries');
    }

    return this.prisma.challengeEntry.delete({
      where: { id: entryId },
    });
  }
}

