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
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutQueryDto } from './dto/workout-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({
  path: 'workouts',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  create(@Request() req: any, @Body() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutsService.create(req.user.id, createWorkoutDto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: WorkoutQueryDto) {
    return this.workoutsService.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.workoutsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(id, req.user.id, updateWorkoutDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.workoutsService.remove(id, req.user.id);
  }

  @Post(':id/copy')
  copy(@Request() req: any, @Param('id') id: string) {
    return this.workoutsService.copy(id, req.user.id);
  }
}
