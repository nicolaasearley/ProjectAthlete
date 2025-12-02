import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WeightLogsService } from './weight-logs.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';
import { UpdateWeightLogDto } from './dto/update-weight-log.dto';
import { WeightLogQueryDto } from './dto/weight-log-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({
  path: 'weight-logs',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class WeightLogsController {
  constructor(private readonly weightLogsService: WeightLogsService) {}

  @Post()
  create(@Request() req: any, @Body() createWeightLogDto: CreateWeightLogDto) {
    return this.weightLogsService.create(req.user.id, createWeightLogDto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: WeightLogQueryDto) {
    return this.weightLogsService.findAll(req.user.id, query);
  }

  @Get('exercise/:exerciseId/progression')
  getExerciseProgression(
    @Request() req: any,
    @Param('exerciseId') exerciseId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.weightLogsService.getExerciseProgression(
      req.user.id,
      exerciseId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.weightLogsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateWeightLogDto: UpdateWeightLogDto,
  ) {
    return this.weightLogsService.update(id, req.user.id, updateWeightLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.weightLogsService.remove(id, req.user.id);
  }
}

