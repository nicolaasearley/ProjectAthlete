import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWeightLogDto {
  @IsOptional()
  @IsString()
  exerciseId?: string;

  @IsOptional()
  @IsString()
  workoutRunId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  reps?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sets?: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

