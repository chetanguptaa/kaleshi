import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { add } from 'date-fns';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(name: string, email: string, password: string) {
    const existing = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prismaService.user.create({
      data: { name, email, password: passwordHash },
    });
    const session = await this.prismaService.session.create({
      data: {
        userId: user.id,
        expiresAt: add(new Date(), { days: 7 }),
      },
    });
    const token = this.signJwt({ sub: user.id, sid: session.id });
    return { token, user };
  }

  async login(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    await this.prismaService.session.deleteMany({
      where: { userId: user.id },
    });
    const session = await this.prismaService.session.create({
      data: {
        userId: user.id,
        expiresAt: add(new Date(), { days: 7 }),
      },
    });
    const token = this.signJwt({ sub: user.id, sid: session.id });
    return { token, user };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
        sub: number;
      };
      return await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });
    } catch {
      return null;
    }
  }

  private signJwt(payload: object): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
  }

  async logout(sessionId: string) {
    await this.prismaService.session
      .deleteMany({ where: { id: sessionId } })
      .catch(() => null);
  }
}
