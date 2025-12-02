import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { Role } from '../common/types/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        profilePicturePath: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if new email already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updateData: any = {};

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
      // If email is changed, reset email verification
      if (updateUserDto.email !== user.email) {
        updateData.emailVerified = false;
      }
    }

    if (updateUserDto.displayName !== undefined) {
      updateData.displayName = updateUserDto.displayName || null;
    }

    if (updateUserDto.firstName !== undefined) {
      updateData.firstName = updateUserDto.firstName || null;
    }

    if (updateUserDto.lastName !== undefined) {
      updateData.lastName = updateUserDto.lastName || null;
    }

    if (updateUserDto.profilePicturePath !== undefined) {
      updateData.profilePicturePath = updateUserDto.profilePicturePath || null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        profilePicturePath: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Password cannot be changed for accounts without a password');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async getProfileStats(userId: string) {
    const [workoutCount, workoutRunCount, weightLogCount] = await Promise.all([
      this.prisma.workout.count({
        where: {
          ownerUserId: userId,
          deletedAt: null,
        },
      }),
      this.prisma.workoutRun.count({
        where: { userId },
      }),
      this.prisma.weightLog.count({
        where: { userId },
      }),
    ]);

    return {
      workoutCount,
      workoutRunCount,
      weightLogCount,
    };
  }

  // Admin-only methods

  async findAll(query: UserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          profilePicturePath: true,
          lastActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserByAdmin(userId: string, adminId: string, updateUserDto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admins from deleting their own account
    if (userId === adminId && updateUserDto.role && updateUserDto.role !== Role.ADMIN) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Check if email is being changed and if new email already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Prevent removing the last admin
    if (updateUserDto.role && user.role === Role.ADMIN && updateUserDto.role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: {
          role: Role.ADMIN,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }

    const updateData: any = {};

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email;
      if (updateUserDto.email !== user.email) {
        updateData.emailVerified = false;
      }
    }

    if (updateUserDto.displayName !== undefined) {
      updateData.displayName = updateUserDto.displayName || null;
    }

    if (updateUserDto.firstName !== undefined) {
      updateData.firstName = updateUserDto.firstName || null;
    }

    if (updateUserDto.lastName !== undefined) {
      updateData.lastName = updateUserDto.lastName || null;
    }

    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.profilePicturePath !== undefined) {
      updateData.profilePicturePath = updateUserDto.profilePicturePath || null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        profilePicturePath: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changeRole(userId: string, adminId: string, changeRoleDto: ChangeRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admins from changing their own role
    if (userId === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Prevent removing the last admin
    if (user.role === Role.ADMIN && changeRoleDto.role !== Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: {
          role: Role.ADMIN,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: changeRoleDto.role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admins from deleting their own account
    if (userId === adminId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Prevent deleting the last admin
    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: {
          role: Role.ADMIN,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
}

