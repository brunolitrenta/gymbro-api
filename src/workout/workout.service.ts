import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExerciseDefinition,
  Plan,
  Prisma,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from '@prismaClient';
import { PrismaService } from 'prisma/prisma.service';
import { ApiResponse } from '../common/response.interface';

@Injectable()
export class WorkoutService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(data: {
    name: string;
    authorId: string;
  }): Promise<ApiResponse<Plan>> {
    const existingPlans = await this.prisma.plan.findMany({
      where: {
        authorId: data.authorId,
        name: {
          startsWith: data.name,
        },
      },
      select: {
        name: true,
      },
    });

    let finalName = data.name;

    if (existingPlans.length > 0) {
      const existingNames = existingPlans.map((p) => p.name);

      if (existingNames.includes(data.name)) {
        let counter = 2;

        while (existingNames.includes(`${data.name} (${counter})`)) {
          counter++;
        }

        finalName = `${data.name} (${counter})`;
      }
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: finalName,
        authorId: data.authorId,
      },
    });

    return {
      data: plan,
      message: 'Plano de treino criado com sucesso',
    };
  }

  async sendPlan(data: {
    trainerId: string;
    studentEmail?: string;
    studentId?: string;
    planId: string;
    makeActive?: boolean;
  }) {
    const {
      trainerId,
      studentEmail,
      studentId: studentIdInput,
      planId,
      makeActive = true,
    } = data;

    const student = await (async () => {
      if (studentIdInput) {
        return this.prisma.user.findUnique({ where: { id: studentIdInput } });
      }
      if (studentEmail) {
        return this.prisma.user.findUnique({ where: { email: studentEmail } });
      }
      throw new Error('Informe studentEmail ou studentId.');
    })();

    const [trainer, plan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: trainerId } }),
      this.prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!trainer || trainer.type !== 'trainer') {
      throw new Error(
        'Somente usuários do tipo "trainer" podem encaminhar treinos.',
      );
    }
    if (!student) {
      throw new Error('Aluno não encontrado.');
    }
    if (student.type !== 'normal') {
      throw new Error('O destinatário precisa ser um usuário normal.');
    }
    if (!plan || plan.authorId !== trainerId) {
      throw new Error('Plano não encontrado ou não pertence a este trainer.');
    }

    const relation = await this.prisma.trainerRelation.findUnique({
      where: {
        trainerId_studentEmail: { trainerId, studentEmail: student.email },
      },
    });
    if (!relation) {
      throw new Error('O aluno não está vinculado a este treinador.');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        if (makeActive) {
          await tx.planAssignment.updateMany({
            where: { studentId: student.id, active: true },
            data: { active: false },
          });
        }

        const assignment = await tx.planAssignment.upsert({
          where: { planId_studentId: { planId, studentId: student.id } },
          update: {
            startDate: new Date(),
            ...(makeActive ? { active: true } : {}),
          },
          create: {
            planId,
            trainerId,
            studentId: student.id,
            startDate: new Date(),
            active: makeActive,
          },
          include: {
            plan: {
              select: { id: true, name: true },
            },
            student: { select: { id: true, name: true, email: true } },
            trainer: { select: { id: true, name: true } },
          },
        });

        return assignment;
      });

      // (opcional) notificar o aluno aqui (email/push), se tiver infra de notificações
      // await notifyStudent(result.student.email, `Você recebeu o plano ${result.plan.name}`)

      return result;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new Error('Este plano já foi encaminhado para este aluno.');
      }
      throw e;
    }
  }

  async createWorkout({
    planId,
    label,
    exerciseIds,
  }: {
    planId: string;
    label: string;
    exerciseIds: string[];
  }): Promise<ApiResponse<{ id: string }>> {
    const workout = await this.prisma.workout.create({
      data: {
        planId: planId,
        name: label,
      },
    });

    await this.prisma.workoutExercise.createMany({
      data: exerciseIds.map((exerciseDefId) => ({
        workoutId: workout.id,
        exerciseDefId,
      })),
      skipDuplicates: true,
    });

    return {
      data: { id: workout.id },
      message: 'Treino criado com sucesso',
    };
  }

  async getAllAccessiblePlans(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, type: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const [createdPlans, receivedAssignments] = await Promise.all([
      this.prisma.plan.findMany({
        where: { authorId: userId },
      }),
      this.prisma.planAssignment.findMany({
        where: { studentId: userId },
        include: {
          plan: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const allPlans = [
      ...createdPlans.map((plan) => ({
        ...plan,
        source: 'created' as const,
        assignment: null,
      })),
      ...receivedAssignments.map((assignment) => ({
        ...assignment.plan,
        source: 'received' as const,
        assignment: {
          id: assignment.id,
          trainerId: assignment.trainerId,
          startDate: assignment.startDate,
          active: assignment.active,
          createdAt: assignment.createdAt,
          trainer: assignment.trainer,
        },
      })),
    ];

    return {
      data: allPlans,
      message: 'Todos os planos acessíveis obtidos com sucesso',
    };
  }

  async getWorkoutsByPlanId(planId: string): Promise<ApiResponse<Workout[]>> {
    const workouts = await this.prisma.workout.findMany({
      where: {
        planId: planId,
      },
      select: {
        id: true,
        name: true,
        planId: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            exerciseDef: {
              select: {
                primaryMuscles: {
                  select: {
                    muscleGroup: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!workouts || workouts.length === 0) {
      throw new NotFoundException('Nenhum treino encontrado para este plano');
    }

    return {
      data: workouts,
      message: 'Treinos obtidos com sucesso',
    };
  }

  async getExercisesByWorkoutId(id: string) {
    const exercises = await this.prisma.workoutExercise.findMany({
      where: {
        workoutId: id,
      },
      include: {
        exerciseDef: true,
      },
    });
    if (!exercises || exercises.length === 0) {
      throw new NotFoundException(
        'Nenhum exercício encontrado para este treino',
      );
    }

    return {
      data: exercises,
      message: 'Exercícios obtidos com sucesso',
    };
  }

  async startSession(userId: string, workoutId?: string) {
    const session = await this.prisma.workoutSession.create({
      data: {
        userId,
        workoutId: workoutId ?? null,
        startedAt: new Date(),
      },
      include: { sets: true },
    });

    return {
      data: session,
      message: 'Sessão de treino iniciada com sucesso',
    };
  }

  async addSetToSession(
    userId: string,
    sessionId: string,
    payload: {
      workoutExerciseId: string;
      weightKg: number;
      sets: number;
      reps: number;
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

    if (payload.reps != null && typeof payload.reps !== 'number') {
      throw new BadRequestException('reps deve ser um número');
    }

    await this.prisma.workoutExercise.update({
      where: { id: payload.workoutExerciseId },
      data: {
        sets: payload.sets ?? null,
        reps: payload.reps ?? null,
        weightKg: payload.weightKg ?? null,
        notes: payload.notes ?? null,
      },
    });

    const set = await this.prisma.setLog.create({
      data: {
        sessionId,
        workoutExerciseId: payload.workoutExerciseId ?? null,
        setNumber: payload.sets,
        weightKg: payload.weightKg,
        reps: payload.reps,
        distanceM: payload.distanceM ?? null,
        durationSeconds: payload.durationSeconds ?? null,
        notes: payload.notes ?? null,
      },
    });

    return {
      data: set,
      message: 'Série adicionada à sessão com sucesso',
    };
  }

  async finishSession(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, finishedAt: true },
    });
    if (!session) throw new NotFoundException('Sessão não encontrada');
    if (session.userId !== userId)
      throw new ForbiddenException('Usuário não autorizado');
    if (session.finishedAt) {
      return {
        data: session,
        message: 'Sessão já estava finalizada',
      };
    }

    const finishedSession = await this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date() },
    });

    return {
      data: finishedSession,
      message: 'Sessão de treino finalizada com sucesso',
    };
  }

  async getAllExercises(): Promise<ApiResponse<ExerciseDefinition[]>> {
    const exercises = await this.prisma.exerciseDefinition.findMany({
      include: {
        primaryMuscles: {
          include: {
            muscleGroup: true,
          },
        },
      },
    });

    return {
      data: exercises,
      message: 'Exercícios obtidos com sucesso',
    };
  }

  async getSession(workoutId: string): Promise<ApiResponse<WorkoutSession>> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { workout: { id: workoutId } },
      include: { sets: true },
      orderBy: { startedAt: 'desc' },
    });
    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return {
      data: session,
      message: 'Sessão encontrada com sucesso',
    };
  }

  async getAllSessionsByUserId(
    userId: string,
  ): Promise<ApiResponse<WorkoutSession[]>> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId },
      include: {
        workout: {
          select: {
            name: true,
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { finishedAt: 'desc' },
    });
    return {
      data: sessions,
      message: 'Sessões obtidas com sucesso',
    };
  }

  async getAllPlanSessions(
    userId: string,
    planId: string,
  ): Promise<ApiResponse<WorkoutSession[]>> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        workout: {
          planId,
        },
      },
      include: {
        workout: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { finishedAt: 'desc' },
    });
    return {
      data: sessions,
      message: 'Sessões do plano obtidas com sucesso',
    };
  }

  async getExerciseInformations(
    exerciseId: string,
  ): Promise<
    ApiResponse<Pick<WorkoutExercise, 'weightKg' | 'sets' | 'reps' | 'notes'>>
  > {
    const exercise = await this.prisma.workoutExercise.findUnique({
      where: { id: exerciseId },
      select: {
        weightKg: true,
        sets: true,
        reps: true,
        notes: true,
      },
    });
    if (!exercise) {
      throw new NotFoundException('Exercício não encontrado');
    }
    return {
      data: exercise,
      message: 'Exercício encontrado com sucesso',
    };
  }
}
