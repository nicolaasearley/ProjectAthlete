import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Privacy } from '../../common/types/enums';

export class CreatePostDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaPaths?: string[];

  @IsOptional()
  @IsEnum(Privacy)
  privacy?: Privacy;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exerciseTags?: string[];

  @IsOptional()
  @IsString()
  location?: string;
}

