import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Plan, Workout } from '@prismaClient';
import { PrismaService } from 'prisma/prisma.service';

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
    });
    return `Workout plan created with ID: ${plan.id}`;
  }

  async createWorkout(data: Workout): Promise<string> {
    const workout = await this.prisma.workout.create({
      data: {
        name: data.name,
        id: data.id,
        planId: data.planId,
        createdAt: new Date(),
        updatedAt: new Date(),
        day: data.day,
      },
    });
    return `Workout created with ID: ${workout.id}`;
  }

  async getAllPlans(authorId: string): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        authorId: authorId,
      },
    });
    if (!plans || plans.length === 0) {
      throw new NotFoundException('Nenhum plano encontrado para este autor');
    }
    return plans;
  }

  async getWorkoutsByPlanId(planId: string): Promise<Workout[]> {
    const workouts = await this.prisma.workout.findMany({
      where: {
        planId: planId,
      },
    });
    if (!workouts || workouts.length === 0) {
      throw new NotFoundException('Nenhum treino encontrado para este plano');
    }
    return workouts;
  }

  async getExercisesByWorkoutId(id: string) {
    const exercises = await this.prisma.workoutExercise.findMany({
      where: {
        workoutId: id,
      },
    });
    if (!exercises || exercises.length === 0) {
      throw new NotFoundException('Nenhum exercício encontrado para este treino');
    }
    return exercises;
  }

  async startSession(userId: string, workoutId?: string) {
    return this.prisma.workoutSession.create({
      data: {
        userId,
        workoutId: workoutId ?? null,
        startedAt: new Date(),
      },
      include: { sets: true },
    });
  }

  async addSetToSession(
    userId: string,
    sessionId: string,
    payload: {
      workoutExerciseId?: string;
      weightKg?: number;
      reps?: number;
      distanceM?: number;
      durationSeconds?: number;
      notes?: string;
    },
  ) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, finishedAt: true },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId)
      throw new ForbiddenException('Sessão não pertence ao usuário');
    if (session.finishedAt)
      throw new BadRequestException('Sessão já finalizada');

    // validação super básica (opcional)
    if (payload.reps != null && typeof payload.reps !== 'number') {
      throw new BadRequestException('reps deve ser um número');
    }

    // setNumber sequencial por (sessão + exercício) — simples e suficiente
    const last = await this.prisma.setLog.findFirst({
      where: {
        sessionId,
        workoutExerciseId: payload.workoutExerciseId ?? null,
      },
      orderBy: { setNumber: 'desc' },
      select: { setNumber: true },
    });
    const nextSetNumber = (last?.setNumber ?? 0) + 1;

    const set = await this.prisma.setLog.create({
      data: {
        sessionId,
        workoutExerciseId: payload.workoutExerciseId ?? null,
        setNumber: nextSetNumber,
        weightKg: payload.weightKg ?? null,
        reps: payload.reps ?? null,
        distanceM: payload.distanceM ?? null,
        durationSeconds: payload.durationSeconds ?? null,
        notes: payload.notes ?? null,
      },
    });

    return set;
  }

  async finishSession(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, finishedAt: true },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId)
      throw new ForbiddenException('Usuário não autorizado');
    if (session.finishedAt) return session;

    return this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    });
  }
}