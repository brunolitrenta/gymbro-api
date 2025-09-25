import { Injectable } from "@nestjs/common";
import { Plan } from "@prismaClient";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class WorkoutService {
    constructor(private readonly prisma: PrismaService) {}

    async createPlan(data: Plan): Promise<string> {
        const plan = await this.prisma.plan.create({
            data: {
                name: data.name,
                id: data.id,
                authorId: data.authorId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        })
        return `Workout plan created with ID: ${plan.id}`;
    }

    async getAllPlans(authorId: string): Promise<Plan[]> {
        return this.prisma.plan.findMany({
            where: {
                authorId: authorId
            }
        });
    }
}