import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prismaClient';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: User): Promise<string> {
    this.findOne(data.email).then((user) => {
      if (user) {
        throw new Error('User already exists');
      }
    });

    const date = new Date();

    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        password: data.password,
        type: data.type,
        name: data.name,
        createdAt: date,
        updatedAt: date,
      },
    });
    return `User created with ID: ${user.id}`;
  }
}
