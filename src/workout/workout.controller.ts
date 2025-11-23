import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import type {
  ExerciseDefinition,
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

  @Post()
  async createWorkout(
    @Body() data: { planId: string; label: string; exerciseIds: string[] },
  ): Promise<ApiResponse<{ id: string }>> {
    return this.workoutService.createWorkout(data);
  }

  @Delete(':id')
  async deleteWorkout(
    @Param() params: { id: string },
  ): Promise<ApiResponse<null>> {
    return this.workoutService.deleteWorkout(params.id);
  }

  @Get(':planId')
  async getWorkoutsByPlanId(
    @Param() params: { planId: string },
  ): Promise<ApiResponse<Workout[]>> {
    return this.workoutService.getWorkoutsByPlanId(params.planId);
  }

  @Post('plan')
  async createWorkoutPlan(
    @Body() data: { name: string; authorId: string },
  ): Promise<ApiResponse<Plan>> {
    return this.workoutService.createPlan(data);
  }

  @Delete('plan/:id')
  async deleteWorkoutPlan(
    @Param() params: { id: string },
  ): Promise<ApiResponse<null>> {
    return this.workoutService.deletePlan(params.id);
  }

  @Post('plan/share')
  async shareWorkoutPlan(
    @Body()
    data: {
      planId: string;
      trainerId: string;
      studentId: string;
      studentEmail: string;
    },
  ): Promise<ApiResponse<null>> {
    return this.workoutService.sendPlan({
      planId: data.planId,
      trainerId: data.trainerId,
      studentId: data.studentId,
      studentEmail: data.studentEmail,
    });
  }

  @Get('plan/all/:userId')
  async getAllAccessiblePlans(@Param() params: { userId: string }) {
    return this.workoutService.getAllAccessiblePlans(params.userId);
  }

  @Get('exercises/all')
  async getAllExercises(): Promise<ApiResponse<ExerciseDefinition[]>> {
    return this.workoutService.getAllExercises();
  }

  @Get('exercises/:id')
  async getExercisesByWorkoutId(
    @Param() params: { id: string },
  ): Promise<ApiResponse<WorkoutExercise[]>> {
    return this.workoutService.getExercisesByWorkoutId(params.id);
  }

  @Post('session/start')
  async startWorkout(
    @Body() data: { workoutId: string; userId: string },
  ): Promise<ApiResponse<WorkoutSession>> {
    return this.workoutService.startSession(data.userId, data.workoutId);
  }

  @Post('session/set')
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

  @Post('session/finish')
  async finishWorkout(
    @Body() data: { userId: string; sessionId: string },
  ): Promise<
    ApiResponse<{ id: string; userId: string; finishedAt: Date | null }>
  > {
    return this.workoutService.finishSession(data.userId, data.sessionId);
  }

  @Get('session/:workoutId')
  async getSession(
    @Param() params: { workoutId: string },
  ): Promise<ApiResponse<WorkoutSession>> {
    return this.workoutService.getSession(params.workoutId);
  }

  @Get('session/all/:userId')
  async getAllSessionsByUserId(@Param() params: { userId: string }) {
    return this.workoutService.getAllSessionsByUserId(params.userId);
  }

  @Get('session/plan/:userId/:planId')
  async getSessionsByPlanId(
    @Param() params: { planId: string; userId: string },
  ): Promise<ApiResponse<WorkoutSession[]>> {
    return this.workoutService.getAllPlanSessions(params.userId, params.planId);
  }

  @Get('exercises/info/:exerciseId')
  async getExerciseInformations(
    @Param() params: { exerciseId: string; workoutId: string },
  ): Promise<
    ApiResponse<Pick<WorkoutExercise, 'weightKg' | 'sets' | 'reps' | 'notes'>>
  > {
    return this.workoutService.getExerciseInformations(params.exerciseId);
  }
}
