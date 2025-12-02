import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadsDir: string;
  private readonly publicUrlBase: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = this.configService.get<string>('UPLOADS_DIR', '/data/uploads');
    this.publicUrlBase = this.configService.get<string>('MEDIA_PUBLIC_URL', '/media');
  }

  async save(file: Buffer, filePath: string, mimeType: string): Promise<string> {
    const fullPath = path.join(this.uploadsDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    // Return public URL path
    return path.join(this.publicUrlBase, filePath).replace(/\\/g, '/');
  }

  getUrl(storagePath: string): string {
    // Remove the uploads dir prefix if present
    const relativePath = storagePath.replace(this.uploadsDir, '').replace(/^[/\\]/, '');
    return path.join(this.publicUrlBase, relativePath).replace(/\\/g, '/');
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = storagePath.startsWith(this.uploadsDir)
      ? storagePath
      : path.join(this.uploadsDir, storagePath);

    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, which is fine for delete operations
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = storagePath.startsWith(this.uploadsDir)
      ? storagePath
      : path.join(this.uploadsDir, storagePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

