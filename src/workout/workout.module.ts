import { WorkoutService } from "./workout.service";
import { PrismaService } from "prisma/prisma.service";
import { WorkoutController } from "./workout.controller";
import { Module } from "@nestjs/common";

@Module({
    providers: [WorkoutService, PrismaService],
    controllers: [WorkoutController],
    exports: [WorkoutService],
})
export class WorkoutModule {}