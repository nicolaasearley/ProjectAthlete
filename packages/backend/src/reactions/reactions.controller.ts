import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReactionTargetType } from '../common/types/enums';

@Controller({
  path: 'reactions',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  createOrUpdate(@Request() req: any, @Body() createReactionDto: CreateReactionDto) {
    return this.reactionsService.createOrUpdate(req.user.id, createReactionDto);
  }

  @Delete(':targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Request() req: any,
    @Param('targetType') targetType: ReactionTargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.reactionsService.remove(req.user.id, targetType, targetId);
  }
}

