import { IsString, IsEnum } from 'class-validator';
import { ReactionType, ReactionTargetType } from '../../common/types/enums';

export class CreateReactionDto {
  @IsEnum(ReactionTargetType)
  targetType: ReactionTargetType;

  @IsString()
  targetId: string;

  @IsEnum(ReactionType)
  reactionType: ReactionType;
}

