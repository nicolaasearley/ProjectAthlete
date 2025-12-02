import { IsString, IsDateString, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChallengeEntryDto {
  @IsString()
  challengeId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

