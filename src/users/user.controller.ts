import { Controller, Get, Put, Delete, UseGuards, Request, Body } from '@nestjs/common';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Request() req, @Body('email') email: string) {
    return this.usersService.updateUser(req.user.userId, { email });
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Request() req) {
    return this.usersService.deleteUser(req.user.userId);
  }
}
