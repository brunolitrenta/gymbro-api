import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import type {
  Plan,
  SetLog,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from '@prismaClient';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiResponse } from '../common/response.interface';

@Controller('workout')
@UseGuards(AuthGuard)
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post('plan')
  async createWorkoutPlan(
    @Body() data: { name: string; authorId: string },
  ): Promise<ApiResponse<Plan>> {
    return this.workoutService.createPlan(data);
  }

  @Post('workout')
  async createWorkout(@Body() data: Workout): Promise<ApiResponse<{ id: string }>> {
    return this.workoutService.createWorkout(data);
  }

  @Get('plan/all/:userId')
  async getAllAccessiblePlans(@Param() params: { userId: string }) {
    return this.workoutService.getAllAccessiblePlans(params.userId);
  }

  @Get('plan/received/:studentId')
  async getReceivedPlans(@Param() params: { studentId: string }) {
    return this.workoutService.getReceivedPlans(params.studentId);
  }

  @Get('plan/:authorId')
  async getWorkoutPlans(
    @Param() params: { authorId: string },
  ): Promise<ApiResponse<Plan[]>> {
    return this.workoutService.getAllPlans(params.authorId);
  }

  @Get('workout/:planId')
  async getWorkoutsByPlanId(
    @Param() params: { planId: string },
  ): Promise<ApiResponse<Workout[]>> {
    return this.workoutService.getWorkoutsByPlanId(params.planId);
  }

  @Get('exercises/:id')
  async getExercisesByWorkoutId(
    @Param() params: { id: string },
  ): Promise<ApiResponse<WorkoutExercise[]>> {
    return this.workoutService.getExercisesByWorkoutId(params.id);
  }

  @Post('workout/session/start')
  async startWorkout(
    @Body() data: { workoutId: string; userId: string },
  ): Promise<ApiResponse<WorkoutSession>> {
    return this.workoutService.startSession(data.userId, data.workoutId);
  }

  @Post('workout/session/set')
  async addSetToSession(
    @Body()
    data: {
      userId: string;
      sessionId: string;
      exerciseId: string;
      reps: number;
      weight: number;
      sets: number;
      distance?: number;
      duration?: number;
      notes?: string;
    },
  ): Promise<ApiResponse<SetLog>> {
    return this.workoutService.addSetToSession(data.userId, data.sessionId, {
      workoutExerciseId: data.exerciseId,
      reps: data.reps,
      weightKg: data.weight,
      sets: data.sets,
      distanceM: data.distance,
      durationSeconds: data.duration,
      notes: data.notes,
    });
  }

  @Post('workout/session/finish')
  async finishWorkout(
    @Body() data: { userId: string; sessionId: string },
  ): Promise<ApiResponse<{ id: string; userId: string; finishedAt: Date | null }>> {
    return this.workoutService.finishSession(data.userId, data.sessionId);
  }
}
