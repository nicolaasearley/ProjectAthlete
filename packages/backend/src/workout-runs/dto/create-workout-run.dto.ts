import { IsString, IsDateString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class CreateWorkoutRunDto {
  @IsString()
  workoutId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsObject()
  results?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  totalTimeSeconds?: number;
}

