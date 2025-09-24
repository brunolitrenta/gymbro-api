import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ token: string }> {
    const user = await this.usersService.findOne(email);
    if (!user) throw new UnauthorizedException();

    // se a senha estiver com hash, use bcrypt.compare
    // if (!(await bcrypt.compare(pass, user.password))) throw new UnauthorizedException();
    if (user.password !== pass) throw new UnauthorizedException();

    const payload = { sub: user.id, username: user.name };
    return { token: await this.jwtService.signAsync(payload) };
  }
}
