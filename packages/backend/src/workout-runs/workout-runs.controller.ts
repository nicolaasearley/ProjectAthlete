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
import { WorkoutRunsService } from './workout-runs.service';
import { CreateWorkoutRunDto } from './dto/create-workout-run.dto';
import { UpdateWorkoutRunDto } from './dto/update-workout-run.dto';
import { WorkoutRunQueryDto } from './dto/workout-run-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({
  path: 'workout-runs',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class WorkoutRunsController {
  constructor(private readonly workoutRunsService: WorkoutRunsService) {}

  @Post()
  create(@Request() req: any, @Body() createWorkoutRunDto: CreateWorkoutRunDto) {
    return this.workoutRunsService.create(req.user.id, createWorkoutRunDto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: WorkoutRunQueryDto) {
    return this.workoutRunsService.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.workoutRunsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateWorkoutRunDto: UpdateWorkoutRunDto,
  ) {
    return this.workoutRunsService.update(id, req.user.id, updateWorkoutRunDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.workoutRunsService.remove(id, req.user.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { results?: Record<string, any>; notes?: string },
  ) {
    return this.workoutRunsService.complete(id, req.user.id, body.results, body.notes);
  }
}

