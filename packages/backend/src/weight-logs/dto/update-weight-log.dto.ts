import { PartialType } from '@nestjs/mapped-types';
import { CreateWeightLogDto } from './create-weight-log.dto';

export class UpdateWeightLogDto extends PartialType(CreateWeightLogDto) {}

