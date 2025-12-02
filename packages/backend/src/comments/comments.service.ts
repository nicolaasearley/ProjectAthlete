import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    // Verify post exists
    const post = await this.prisma.post.findFirst({
      where: {
        id: createCommentDto.postId,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If parent comment specified, verify it exists
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: {
          id: createCommentDto.parentCommentId,
          deletedAt: null,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId: createCommentDto.postId,
        userId,
        text: createCommentDto.text,
        parentCommentId: createCommentDto.parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            profilePicturePath: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });
  }

  async findByPost(postId: string) {
    // Verify post exists
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
        parentCommentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            profilePicturePath: true,
          },
        },
        replies: {
          where: {
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                profilePicturePath: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        text: updateCommentDto.text,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            profilePicturePath: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    return this.prisma.comment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

