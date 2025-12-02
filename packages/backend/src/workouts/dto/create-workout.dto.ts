import { IsString, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutType } from '../../common/types/enums';

export class ExerciseDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsString()
  sets?: string;

  @IsOptional()
  @IsString()
  reps?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  tempo?: string;

  @IsOptional()
  @IsString()
  rest?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  groupType?: string;

  @IsOptional()
  @IsNumber()
  groupIndex?: number;
}

export class CreateWorkoutDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(WorkoutType)
  type: WorkoutType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];

  @IsOptional()
  @IsNumber()
  estimatedTimeMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}

