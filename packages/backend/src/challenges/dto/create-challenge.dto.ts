import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, IsBoolean } from 'class-validator';
import { ChallengeMetricType } from '../../common/types/enums';
import { Type } from 'class-transformer';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ChallengeMetricType)
  metricType: ChallengeMetricType;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  targetValue?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

