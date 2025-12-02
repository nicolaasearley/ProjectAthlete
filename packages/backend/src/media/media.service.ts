import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageProvider } from '../storage/interfaces/storage-provider.interface';
import { LocalStorageProvider } from '../storage/providers/local-storage.provider';
import { FileSanitizer } from '../storage/utils/file-sanitizer';
import { FileValidator } from '../storage/utils/file-validator';
import { StorageProvider } from '../common/types/enums';
import { MulterFile } from '../common/types/multer.types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private storageProvider: IStorageProvider;

  constructor(
    private prisma: PrismaService,
    private localStorageProvider: LocalStorageProvider,
  ) {
    // Use local storage provider by default
    // TODO: Support switching based on environment/config
    this.storageProvider = this.localStorageProvider;
  }

  async uploadFile(
    userId: string,
    file: MulterFile,
    metadata?: {
      storageProvider?: StorageProvider;
    },
  ) {
    // Validate file
    const validation = FileValidator.validateFile(file, 'both');
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Generate UUID for directory structure
    const fileUuid = uuidv4();
    const sanitizedFilename = FileSanitizer.sanitizeFilename(file.originalname);
    const storagePath = FileSanitizer.generateStoragePath(userId, sanitizedFilename, fileUuid);

    // Calculate MD5 checksum
    const checksum = crypto.createHash('md5').update(file.buffer).digest('hex');

    // Save file to storage
    const publicUrlPath = await this.storageProvider.save(file.buffer, storagePath, file.mimetype);

    // Create MediaFile record
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        userId,
        filename: sanitizedFilename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: BigInt(file.size),
        storagePath,
        publicUrlPath,
        storageProvider: metadata?.storageProvider || StorageProvider.LOCAL,
        checksumMd5: checksum,
      },
    });

    return mediaFile;
  }

  async findOne(id: string, userId?: string) {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    // Optionally check ownership (for private media)
    if (userId && mediaFile.userId && mediaFile.userId !== userId) {
      // In the future, check privacy settings
      // For now, allow viewing if user is provided
    }

    return mediaFile;
  }

  async findByUser(userId: string) {
    return this.prisma.mediaFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string, userId: string) {
    const mediaFile = await this.prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!mediaFile) {
      throw new NotFoundException('Media file not found');
    }

    // Check ownership
    if (mediaFile.userId && mediaFile.userId !== userId) {
      throw new BadRequestException('You can only delete your own media files');
    }

    // Delete from storage
    try {
      await this.storageProvider.delete(mediaFile.storagePath);
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete database record
    return this.prisma.mediaFile.delete({
      where: { id },
    });
  }
}

