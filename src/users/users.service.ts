import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prismaClient';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findId(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: User): Promise<string> {

    this.findEmail(data.email).then((user) => {
      if (user) {
        throw new Error('User already exists');
      }
    });

    const id = uuidv4();

    this.findId(id).then((user) => {
      if (user) {
        throw new Error('User ID already exists');
      }
    });

    const date = new Date();

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        id: id,
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
        createdAt: date,
        updatedAt: date,
      },
    });
    return `User created with ID: ${user.id}`;
  }
}
