import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { CreateChallengeEntryDto } from './dto/create-challenge-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/types/enums';

@Controller({
  path: 'challenges',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.COACH, Role.ADMIN)
  create(@Request() req: any, @Body() createChallengeDto: CreateChallengeDto) {
    return this.challengesService.create(req.user.id, createChallengeDto);
  }

  @Get()
  findAll(@Query() query: ChallengeQueryDto) {
    return this.challengesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(id, req.user.id, updateChallengeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.challengesService.remove(id, req.user.id);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.challengesService.getLeaderboard(id);
  }

  @Get(':id/entries')
  getEntries(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.challengesService.getEntries(id, userId);
  }

  @Post(':id/entries')
  createEntry(@Request() req: any, @Param('id') challengeId: string, @Body() createEntryDto: CreateChallengeEntryDto) {
    return this.challengesService.createEntry(req.user.id, {
      ...createEntryDto,
      challengeId,
    });
  }

  @Patch('entries/:entryId')
  updateEntry(
    @Request() req: any,
    @Param('entryId') entryId: string,
    @Body() body: { value: number; notes?: string },
  ) {
    return this.challengesService.updateEntry(entryId, req.user.id, body.value, body.notes);
  }

  @Delete('entries/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteEntry(@Request() req: any, @Param('entryId') entryId: string) {
    return this.challengesService.deleteEntry(entryId, req.user.id);
  }
}

