import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { Privacy } from '../common/types/enums';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        userId,
        text: createPostDto.text,
        mediaPaths: createPostDto.mediaPaths || [],
        privacy: createPostDto.privacy || Privacy.PUBLIC,
        exerciseTags: createPostDto.exerciseTags || [],
        location: createPostDto.location || null,
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
            comments: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, query: PostQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      moderationStatus: 'APPROVED',
    };

    // Filter by user if specified
    if (query.userId) {
      where.userId = query.userId;
      // Users can see their own posts regardless of privacy
    } else {
      // Show public posts or posts from users the current user follows (future: friends)
      // For now, just show public posts
      where.privacy = Privacy.PUBLIC;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Get reaction counts for each post
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const reactions = await this.prisma.reaction.findMany({
          where: {
            targetType: 'POST',
            targetId: post.id,
          },
        });

        const reactionCounts = reactions.reduce((acc, reaction) => {
          acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Check if current user has reacted
        const userReaction = reactions.find((r) => r.userId === userId);

        return {
          ...post,
          reactionCounts,
          userReaction: userReaction ? userReaction.reactionType : null,
        };
      }),
    );

    return {
      data: postsWithReactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
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
        comments: {
          where: {
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
            },
            _count: {
              select: {
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check privacy
    if (post.privacy !== Privacy.PUBLIC && post.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this post');
    }

    // Get reactions
    const reactions = await this.prisma.reaction.findMany({
      where: {
        targetType: 'POST',
        targetId: post.id,
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

    const reactionCounts = reactions.reduce((acc, reaction) => {
      acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userReaction = reactions.find((r) => r.userId === userId);

    return {
      ...post,
      reactionCounts,
      userReaction: userReaction ? userReaction.reactionType : null,
    };
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto) {
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(updatePostDto.text !== undefined && { text: updatePostDto.text }),
        ...(updatePostDto.mediaPaths !== undefined && {
          mediaPaths: updatePostDto.mediaPaths,
        }),
        ...(updatePostDto.privacy !== undefined && { privacy: updatePostDto.privacy }),
        ...(updatePostDto.exerciseTags !== undefined && {
          exerciseTags: updatePostDto.exerciseTags,
        }),
        ...(updatePostDto.location !== undefined && {
          location: updatePostDto.location || null,
        }),
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
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    return this.prisma.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

