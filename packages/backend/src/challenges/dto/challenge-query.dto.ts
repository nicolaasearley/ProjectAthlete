import { IsOptional, IsBoolean } from 'class-validator';

export class ChallengeQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

