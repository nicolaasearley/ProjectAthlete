import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutRunDto } from './create-workout-run.dto';

export class UpdateWorkoutRunDto extends PartialType(CreateWorkoutRunDto) {}

