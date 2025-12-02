import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/types/enums';

@Controller({
  path: 'users',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('me/stats')
  async getMyStats(@Request() req: any) {
    return this.usersService.getProfileStats(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Patch('me/password')
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  // Admin-only endpoints - must come before :id route

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserByAdmin(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    return this.usersService.updateUserByAdmin(id, req.user.id, updateUserDto);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async changeRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.usersService.changeRole(id, req.user.id, changeRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteUser(id, req.user.id);
  }
}

