import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization, CurrentUser } from '@/common/decorators';

import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization()
  @ApiOperation({ summary: 'List all users' })
  @Get()
  public findAll() {
    return this.userService.findAll();
  }

  @Authorization()
  @ApiOperation({ summary: "Update the current user's profile" })
  @Patch('me')
  public updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  @Authorization()
  @ApiOperation({ summary: "Change the current user's password" })
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  public changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Get a single user by id' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
