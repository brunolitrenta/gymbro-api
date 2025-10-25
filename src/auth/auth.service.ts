import { Injectable, UnauthorizedException} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ token: string }> {
    const user = await this.usersService.findEmail(email);
    if (!user) throw new UnauthorizedException('Email inválido');

    const passwordOk = await bcrypt.compare(pass, user.password);
    if (!passwordOk) throw new UnauthorizedException('Senha inválida');

    const payload = { sub: user.id, username: user.name };
    return { token: await this.jwtService.signAsync(payload) };
  }
}
