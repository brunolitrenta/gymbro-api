import { Injectable, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prismaClient';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../common/response.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: User): Promise<ApiResponse<{ id: string }>> {
    const existingEmail = await this.findEmail(data.email);
    if (existingEmail) {
      throw new ForbiddenException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        type: data.type,
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate,
        goal: data.goal,
        height: data.height,
        weight: data.weight,
        medical: data.medical,
      },
    });

    return {
      data: { id: user.id },
      message: 'Usuário criado com sucesso',
    };
  }

  async createRelation(data: {
    trainerId: string;
    studentEmail: string;
    nickname?: string;
  }): Promise<
    ApiResponse<{ trainerId: string; studentEmail: string; nickname?: string }>
  > {
    // Verify that both trainer and student exist
    const trainer = await this.prisma.user.findUnique({
      where: { id: data.trainerId },
    });

    if (!trainer) {
      throw new ForbiddenException('Treinador não encontrado');
    }

    const student = await this.prisma.user.findUnique({
      where: { email: data.studentEmail },
    });

    if (!student) {
      throw new ForbiddenException('Aluno não encontrado');
    }

    const relation = await this.prisma.trainerRelation.create({
      data: {
        trainer: {
          connect: { id: data.trainerId },
        },
        student: {
          connect: { email: data.studentEmail },
        },
        nickname: data.nickname,
      },
    });

    return {
      data: {
        trainerId: relation.trainerId,
        studentEmail: relation.studentEmail,
        nickname: relation.nickname || undefined,
      },
      message: 'Relação entre treinador e aluno criada com sucesso',
    };
  }

  async deleteRelation(data: {
    trainerId: string;
    studentEmail: string;
  }): Promise<ApiResponse<null>> {
    await this.prisma.trainerRelation.delete({
      where: {
        trainerId_studentEmail: {
          trainerId: data.trainerId,
          studentEmail: data.studentEmail,
        },
      },
    });

    return {
      data: null,
      message: 'Relação removida com sucesso',
    };
  }

  async getRelations(trainerId: string) {
    const relations = await this.prisma.trainerRelation.findMany({
      where: { trainerId },
      include: { student: true },
    });

    return {
      data: relations,
      message: 'Relações obtidas com sucesso',
    };
  }

  async addWeightHistory(data: {
    userId: string;
    weightKg: number;
    date?: Date;
    notes?: string;
  }) {
    const weightHistory = await this.prisma.weightHistory.create({
      data: {
        userId: data.userId,
        weightKg: data.weightKg,
        date: data.date || new Date(),
      },
    });

    return {
      data: weightHistory,
      message: 'Peso registrado com sucesso',
    };
  }

  async getWeightHistory(userId: string, limit?: number) {
    const history = await this.prisma.weightHistory.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return {
      data: history,
      message: 'Histórico de peso obtido com sucesso',
    };
  }

  async deleteWeightHistory(id: string): Promise<ApiResponse<null>> {
    await this.prisma.weightHistory.delete({
      where: { id },
    });

    return {
      data: null,
      message: 'Registro de peso removido com sucesso',
    };
  }

  async updateWeightHistory(
    id: string,
    data: { weightKg?: number; date?: Date; notes?: string },
  ) {
    const updated = await this.prisma.weightHistory.update({
      where: { id },
      data: {
        weightKg: data.weightKg,
        date: data.date,
      },
    });

    return {
      data: updated,
      message: 'Registro de peso atualizado com sucesso',
    };
  }

  /**
   * Converte uma data UTC para o início do dia no timezone especificado
   * @param date - Data a ser convertida
   * @param timezone - Timezone IANA (ex: 'America/Sao_Paulo')
   * @returns Timestamp do início do dia no timezone especificado
   */
  private getStartOfDayInTimezone(date: Date, timezone: string): number {
    const dateStr = date.toLocaleString('en-US', { timeZone: timezone });
    const localDate = new Date(dateStr);
    localDate.setHours(0, 0, 0, 0);
    return localDate.getTime();
  }

  /**
   * Obtém a data/hora atual no timezone do usuário
   * @param timezone - Timezone IANA
   * @returns Data atual no timezone especificado
   */
  private getNowInTimezone(timezone: string): Date {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: timezone });
    return new Date(nowStr);
  }

  /**
   * Calcula a sequência atual de dias consecutivos de treino do usuário
   * Considera todas as sessões (finalizadas ou abandonadas)
   * Respeita os dias da semana configurados pelo usuário (workoutDays)
   * @param userId - ID do usuário
   * @param timezone - Timezone IANA do usuário (opcional, padrão: 'America/Sao_Paulo')
   * @returns objeto com currentStreak, longestStreak e lastWorkoutDate
   */
  async getWorkoutStreak(userId: string, timezone?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { workoutDays: true },
    });

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        finishedAt: {
          not: null,
        }
      },
      orderBy: { finishedAt: 'desc' },
      select: {
        finishedAt: true,

      },
    });

    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        isActiveToday: false,
      };
    }

    const userTimezone = timezone || 'America/Sao_Paulo';

    const uniqueDates = Array.from(
      new Set(
        sessions.map((session) => {
          return this.getStartOfDayInTimezone(
            new Date(session.finishedAt!),
            userTimezone,
          );
        }),
      ),
    ).sort((a, b) => b - a);

    const nowInUserTz = this.getNowInTimezone(userTimezone);
    const today = new Date(nowInUserTz);
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTime = yesterday.getTime();

    const isActiveToday = uniqueDates[0] === todayTime;

    const workoutDays = user?.workoutDays || [];
    const hasScheduledDays = workoutDays.length > 0;

    const isRestDay = (dateTime: number): boolean => {
      if (!hasScheduledDays) return false;
      const date = new Date(dateTime);
      const dayOfWeek = date.getDay();
      return !workoutDays.includes(dayOfWeek);
    };

    const getNextExpectedWorkoutDate = (currentDate: number): number => {
      let nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() - 1);
      let nextTime = nextDate.getTime();

      if (hasScheduledDays) {
        while (isRestDay(nextTime)) {
          nextDate.setDate(nextDate.getDate() - 1);
          nextTime = nextDate.getTime();
        }
      }

      return nextTime;
    };

    let currentStreak = 0;
    let expectedDate = isActiveToday ? todayTime : yesterdayTime;

    if (!isActiveToday && hasScheduledDays && !isRestDay(todayTime)) {
      currentStreak = 0;
    } else {
      for (const dateTime of uniqueDates) {
        if (dateTime === expectedDate) {
          currentStreak++;
          expectedDate = getNextExpectedWorkoutDate(expectedDate);
        } else if (dateTime < expectedDate) {
          let tempDate = expectedDate;
          let foundMatch = false;

          while (tempDate > dateTime) {
            if (tempDate === dateTime) {
              foundMatch = true;
              currentStreak++;
              expectedDate = getNextExpectedWorkoutDate(dateTime);
              break;
            }
            if (isRestDay(tempDate)) {
              tempDate = getNextExpectedWorkoutDate(tempDate);
            } else {
              break;
            }
          }

          if (!foundMatch) break;
        }
      }
    }

    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = uniqueDates[i];
      const nextDate = uniqueDates[i + 1];

      let expectedNextDate = getNextExpectedWorkoutDate(currentDate);

      if (nextDate === expectedNextDate) {
        tempStreak++;
      } else {
        let tempDate = expectedNextDate;
        let isValid = false;

        while (tempDate >= nextDate) {
          if (tempDate === nextDate) {
            isValid = true;
            tempStreak++;
            break;
          }
          if (hasScheduledDays && isRestDay(tempDate)) {
            tempDate = getNextExpectedWorkoutDate(tempDate);
          } else {
            break;
          }
        }

        if (!isValid) {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      data: {
        currentStreak,
        longestStreak,
        lastWorkoutDate: new Date(uniqueDates[0]),
        isActiveToday,
        totalWorkoutDays: uniqueDates.length,
        scheduledWorkoutDays: workoutDays,
      },
      message: 'Sequência de treinos obtida com sucesso',
    };
  }

  /**
   * Define os dias da semana em que o usuário treina
   * @param userId - ID do usuário
   * @param workoutDays - Array com dias da semana (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
   */

  async setWorkoutDays(userId: string, workoutDays: number[]) {
    const validDays = workoutDays.filter((day) => day >= 0 && day <= 6);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { workoutDays: validDays },
    });

    return {
      data: { workoutDays: updated.workoutDays },
      message: 'Dias de treino configurados com sucesso',
    };
  }

  async getWorkoutDays(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { workoutDays: true },
    });

    const dayNames = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    return {
      data: {
        workoutDays: user?.workoutDays || [],
        workoutDaysNames: (user?.workoutDays || []).map((day) => dayNames[day]),
      },
      message: 'Dias de treino obtidos com sucesso',
    };
  }

  async getMainPageData(userId: string, timezone?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { workoutDays: true },
    });

    const userTimezone = timezone || 'America/Sao_Paulo';
    const getStreak = await this.getWorkoutStreak(userId, timezone);

    const nowInUserTz = this.getNowInTimezone(userTimezone);
    const year = nowInUserTz.getFullYear();
    const month = nowInUserTz.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: firstDayOfMonth,
        },
      },
      select: {
        startedAt: true,
        finishedAt: true,
      },
    });

    const uniqueDays = new Set(
      sessions.map((session) => {
        const sessionDate = new Date(session.finishedAt || session.startedAt);
        const dateStr = sessionDate.toLocaleString('en-US', {
          timeZone: userTimezone,
        });
        const localDate = new Date(dateStr);
        return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
      }),
    );

    const monthSessions = uniqueDays.size;

    const calculatePossibleSessions = (): number => {
      const workoutDays = user?.workoutDays || [];

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      let count = 0;
      const currentDate = new Date(firstDay);

      if (workoutDays.length === 0) {
        while (currentDate <= lastDay) {
          count++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
      }

      while (currentDate <= lastDay) {
        const dayOfWeek = currentDate.getDay();
        if (workoutDays.includes(dayOfWeek)) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return count;
    };

    const totalPossibleSessions = calculatePossibleSessions();

    const completionRate =
      totalPossibleSessions > 0
        ? Math.round((monthSessions / totalPossibleSessions) * 100)
        : 0;

    return {
      data: {
        currentStreak: getStreak?.data?.currentStreak,
        monthSessions,
        completedSessions: sessions,
        totalPossibleSessions,
        completionRate,
      },
      message: 'Dados da página principal obtidos com sucesso',
    };
  }

  async updateUser(userId: string, data: Partial<User>) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name || undefined,
        gender: data.gender || undefined,
        birthDate: data.birthDate || undefined,
        goal: data.goal || undefined,
        height: data.height || undefined,
        weight: data.weight || undefined,
        medical: data.medical || undefined,
        workoutDays: data.workoutDays || undefined,
      },
    });

    if (data.weight !== undefined && data.weight !== null) {
      await this.prisma.weightHistory.create({
        data: {
          userId: userId,
          weightKg: data.weight,
          date: new Date(),
        },
      });
    }

    return { data: updated, message: 'Usuário atualizado com sucesso' };
  }

  async getUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return { data: user, message: 'Dados do usuário obtidos com sucesso' };
  }

  async getProgressData(userId: string, timezone?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { goal: true },
    });

    const weightHistory = await this.prisma.weightHistory.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: firstDayOfMonth,
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    const currentStreak = await this.getWorkoutStreak(userId, timezone);

    return {
      data: {
        weightHistory,
        goal: user?.goal,
        monthSessionsCount: sessions?.length,
        currentStreak: currentStreak?.data?.currentStreak,
      },
      message: 'Dados de progresso obtidos com sucesso',
    };
  }

  async getAllSetLogs(userId: string) {
    const setLogs = await this.prisma.setLog.findMany({
      where: { session: { userId } },
      orderBy: { session: { startedAt: 'desc' } },
      include: {
        session: true,
        workoutExercise: {
          select: {
            exerciseDef: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      data: setLogs,
      message: 'Registros de séries obtidos com sucesso',
    };
  }
}
