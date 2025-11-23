import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { User } from '@prismaClient';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() userData: User) {
    return this.usersService.createUser(userData);
  }

  @Post('relation/create')
  @UseGuards(AuthGuard)
  createRelation(
    @Body()
    relationData: {
      trainerId: string;
      studentEmail: string;
      nickname?: string;
    },
  ) {
    return this.usersService.createRelation(relationData);
  }

  @Post('relation/delete')
  @UseGuards(AuthGuard)
  deleteRelation(
    @Body() relationData: { trainerId: string; studentEmail: string },
  ) {
    return this.usersService.deleteRelation(relationData);
  }

  @Get('relation/:trainerId')
  @UseGuards(AuthGuard)
  getRelations(@Param('trainerId') trainerId: string) {
    return this.usersService.getRelations(trainerId);
  }

  @Post('weight-history')
  @UseGuards(AuthGuard)
  addWeightHistory(
    @Body()
    data: {
      userId: string;
      weightKg: number;
      date?: string;
    },
  ) {
    return this.usersService.addWeightHistory({
      userId: data.userId,
      weightKg: data.weightKg,
      date: data.date ? new Date(data.date) : undefined,
    });
  }

  @Get('weight-history/:userId')
  @UseGuards(AuthGuard)
  getWeightHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getWeightHistory(
      userId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Delete('weight-history/:id')
  @UseGuards(AuthGuard)
  deleteWeightHistory(@Param('id') id: string) {
    return this.usersService.deleteWeightHistory(id);
  }

  @Put('weight-history/:id')
  @UseGuards(AuthGuard)
  updateWeightHistory(
    @Param('id') id: string,
    @Body()
    data: {
      weightKg?: number;
      date?: string;
    },
  ) {
    return this.usersService.updateWeightHistory(id, {
      weightKg: data.weightKg,
      date: data.date ? new Date(data.date) : undefined,
    });
  }

  @Get('workout-streak/:userId')
  @UseGuards(AuthGuard)
  getWorkoutStreak(
    @Param('userId') userId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.usersService.getWorkoutStreak(userId, timezone);
  }

  @Post('workout-days/:userId')
  @UseGuards(AuthGuard)
  setWorkoutDays(
    @Param('userId') userId: string,
    @Body() data: { workoutDays: number[] },
  ) {
    return this.usersService.setWorkoutDays(userId, data.workoutDays);
  }

  @Get('workout-days/:userId')
  @UseGuards(AuthGuard)
  getWorkoutDays(@Param('userId') userId: string) {
    return this.usersService.getWorkoutDays(userId);
  }

  @Get('main/:userId')
  @UseGuards(AuthGuard)
  getMainData(
    @Param('userId') userId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.usersService.getMainPageData(userId, timezone);
  }

  @Put(':userId')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('userId') userId: string,
    @Body() updateData: Partial<User>,
  ) {
    return this.usersService.updateUser(userId, updateData);
  }

  @Get(':userId')
  @UseGuards(AuthGuard)
  getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserData(userId);
  }

  @Get('progress/:userId')
  @UseGuards(AuthGuard)
  getProgress(@Param('userId') userId: string) {
    return this.usersService.getMainPageData(userId);
  }

  @Get('progress/logs/:userId')
  @UseGuards(AuthGuard)
  getProgressLogs(@Param('userId') userId: string) {
    return this.usersService.getAllSetLogs(userId);
  }
}
