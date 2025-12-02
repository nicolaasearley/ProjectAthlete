import { IsOptional, IsString, IsEnum } from 'class-validator';
import { StorageProvider } from '../../common/types/enums';

export class CreateMediaDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  originalFilename?: string;

  @IsOptional()
  @IsEnum(StorageProvider)
  storageProvider?: StorageProvider;
}

