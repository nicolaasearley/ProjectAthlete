import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationType } from '../common/types/enums';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createNotificationDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        relatedEntityType: createNotificationDto.relatedEntityType || null,
        relatedEntityId: createNotificationDto.relatedEntityId || null,
      },
    });
  }

  async findAll(userId: string, query: NotificationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only view your own notifications');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // Helper method to create notifications for common events
  async createCommentNotification(
    postId: string,
    postUserId: string,
    commentUserId: string,
    commentText: string,
  ) {
    if (postUserId === commentUserId) {
      return; // Don't notify self
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        text: true,
      },
    });

    const commentUser = await this.prisma.user.findUnique({
      where: { id: commentUserId },
      select: {
        displayName: true,
        email: true,
      },
    });

    const displayName = commentUser?.displayName || commentUser?.email || 'Someone';
    const preview = commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText;

    return this.create({
      userId: postUserId,
      type: NotificationType.COMMENT,
      title: 'New comment on your post',
      message: `${displayName} commented: "${preview}"`,
      relatedEntityType: 'POST',
      relatedEntityId: postId,
    });
  }

  async createReactionNotification(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    targetUserId: string,
    reactionUserId: string,
    reactionType: string,
  ) {
    if (targetUserId === reactionUserId) {
      return; // Don't notify self
    }

    const reactionUser = await this.prisma.user.findUnique({
      where: { id: reactionUserId },
      select: {
        displayName: true,
        email: true,
      },
    });

    const displayName = reactionUser?.displayName || reactionUser?.email || 'Someone';
    const emojiMap: Record<string, string> = {
      LIKE: '👍',
      LOVE: '❤️',
      FIRE: '🔥',
      THUMBS_UP: '👏',
      CELEBRATE: '🎉',
    };
    const emoji = emojiMap[reactionType] || '👍';

    return this.create({
      userId: targetUserId,
      type: NotificationType.REACTION,
      title: 'New reaction',
      message: `${displayName} reacted ${emoji} to your ${targetType.toLowerCase()}`,
      relatedEntityType: targetType,
      relatedEntityId: targetId,
    });
  }
}

