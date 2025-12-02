import { IsEnum } from 'class-validator';
import { Role } from '../../common/types/enums';

export class ChangeRoleDto {
  @IsEnum(Role)
  role: Role;
}

