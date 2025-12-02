import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

