import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from '@prismaClient';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() userData: User) {
    return this.usersService.createUser(userData);
  }
}
