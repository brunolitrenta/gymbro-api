import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { WorkoutService } from "./workout.service";
import type { Plan } from "@prismaClient";

@Controller('workout')
export class WorkoutController {
    constructor(private readonly workoutService: WorkoutService) {}

    @Post('plan')
    async createWorkout(@Body() data: Plan): Promise<string> {
        return this.workoutService.createPlan(data);
    }

    @Get('plan/:authorId')
    async getWorkoutPlans(@Param() params: { authorId: string }): Promise<Plan[]> {
        return this.workoutService.getAllPlans(params.authorId);
    }
}