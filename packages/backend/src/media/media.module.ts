import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { LocalStorageProvider } from '../storage/providers/local-storage.provider';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [MediaController],
  providers: [MediaService, LocalStorageProvider],
  exports: [MediaService],
})
export class MediaModule {}

