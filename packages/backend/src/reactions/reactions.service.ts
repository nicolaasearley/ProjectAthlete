import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionTargetType } from '../common/types/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReactionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async createOrUpdate(userId: string, createReactionDto: CreateReactionDto) {
    // Verify target exists and get target user ID
    let targetUserId: string | null = null;

    if (createReactionDto.targetType === ReactionTargetType.POST) {
      const post = await this.prisma.post.findFirst({
        where: {
          id: createReactionDto.targetId,
          deletedAt: null,
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }
      targetUserId = post.userId;
    } else if (createReactionDto.targetType === ReactionTargetType.COMMENT) {
      const comment = await this.prisma.comment.findFirst({
        where: {
          id: createReactionDto.targetId,
          deletedAt: null,
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      targetUserId = comment.userId;
    } else {
      throw new BadRequestException('Invalid target type');
    }

    // Check if reaction already exists
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: createReactionDto.targetType,
          targetId: createReactionDto.targetId,
        },
      },
    });

    if (existingReaction) {
      // If same reaction type, remove it (toggle off)
      if (existingReaction.reactionType === createReactionDto.reactionType) {
        await this.prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        return { action: 'removed', reaction: null };
      } else {
        // Update to new reaction type
        return this.prisma.reaction.update({
          where: { id: existingReaction.id },
          data: {
            reactionType: createReactionDto.reactionType,
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        });
      }
    }

    // Create new reaction
    const reaction = await this.prisma.reaction.create({
      data: {
        userId,
        targetType: createReactionDto.targetType,
        targetId: createReactionDto.targetId,
        reactionType: createReactionDto.reactionType,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // Create notification for target owner
    try {
      if (targetUserId) {
        await this.notificationsService.createReactionNotification(
          createReactionDto.targetType,
          createReactionDto.targetId,
          targetUserId,
          userId,
          createReactionDto.reactionType,
        );
      }
    } catch (err) {
      // Don't fail reaction creation if notification fails
      console.error('Failed to create notification:', err);
    }

    return {
      action: 'created',
      reaction,
    };
  }

  async remove(userId: string, targetType: ReactionTargetType, targetId: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType,
          targetId,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    return this.prisma.reaction.delete({
      where: { id: reaction.id },
    });
  }

  async findByTarget(targetType: ReactionTargetType, targetId: string) {
    return this.prisma.reaction.findMany({
      where: {
        targetType,
        targetId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            profilePicturePath: true,
          },
        },
      },
    });
  }
}

