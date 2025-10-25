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

@Controller('workout')
@UseGuards(AuthGuard)
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post('plan')
  async createWorkoutPlan(@Body() data: Plan): Promise<string> {
    return this.workoutService.createPlan(data);
  }

  @Post('workout')
  async createWorkout(@Body() data: Workout): Promise<string> {
    return this.workoutService.createWorkout(data);
  }

  @Get('plan/:authorId')
  async getWorkoutPlans(
    @Param() params: { authorId: string },
  ): Promise<Plan[]> {
    return this.workoutService.getAllPlans(params.authorId);
  }

  @Get('workout/:planId')
  async getWorkoutsByPlanId(
    @Param() params: { planId: string },
  ): Promise<Workout[]> {
    return this.workoutService.getWorkoutsByPlanId(params.planId);
  }

  @Get('exercises/:id')
  async getExercisesByWorkoutId(
    @Param() params: { id: string },
  ): Promise<WorkoutExercise[]> {
    return this.workoutService.getExercisesByWorkoutId(params.id);
  }

  @Post('workout/session/start')
  async startWorkout(
    @Body() data: { workoutId: string; userId: string },
  ): Promise<WorkoutSession> {
    return this.workoutService.startSession(data.userId, data.workoutId);
  }

  @Post('workout/session/set')
  async addSetToSession(
    @Body()
    data: {
      userId: string;
      sessionId: string;
      exerciseId: string;
      reps?: number;
      weight?: number;
      distance?: number;
      duration?: number;
      notes?: string;
    },
  ): Promise<SetLog> {
    return this.workoutService.addSetToSession(data.userId, data.sessionId, {
      workoutExerciseId: data.exerciseId,
      reps: data.reps,
      weightKg: data.weight,
      distanceM: data.distance,
      durationSeconds: data.duration,
      notes: data.notes,
    });
  }

  @Post('workout/session/finish')
  async finishWorkout(
    @Body() data: { userId: string; sessionId: string },
  ): Promise<{ id: string; userId: string; finishedAt: Date | null }> {
    return this.workoutService.finishSession(data.userId, data.sessionId);
  }
}
