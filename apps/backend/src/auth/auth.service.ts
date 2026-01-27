import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { add } from 'date-fns';
import * as jwt from 'jsonwebtoken';
import { AppRequest, IRequestUser } from 'src/@types/express';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(name: string, email: string, password: string) {
    const existing = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    return this.prismaService.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { name: 'COMMON' },
      });
      if (!role) {
        throw new Error(
          'Base COMMON role not found. Seed roles before signup.',
        );
      }
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          userRoles: {
            create: {
              roleId: role.id,
            },
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          account: true,
        },
      });
      const session = await tx.session.create({
        data: {
          userId: user.id,
          expiresAt: add(new Date(), { days: 7 }),
        },
      });
      const token = this.signJwt({
        name: user.name,
        email: user.email,
        sub: user.id,
        roles: user.userRoles.map((ur) => ur.role.name),
        accountId: user.account ? user.account.id : null,
        sid: session.id,
      });
      return { token };
    });
  }

  async login(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        account: true,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return this.prismaService.$transaction(async (tx) => {
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
      const session = await tx.session.create({
        data: {
          userId: user.id,
          expiresAt: add(new Date(), { days: 7 }),
        },
      });
      const token = this.signJwt({
        name: user.name,
        email: user.email,
        sub: user.id,
        roles: user.userRoles.map((ur) => ur.role.name),
        accountId: user.account ? user.account.id : null,
        sid: session.id,
      });
      return { token };
    });
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as unknown as IRequestUser;
      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });
      if (user) {
        return decoded;
      }
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

  async getMe(request: AppRequest) {
    const user = await this.prismaService.user.findUnique({
      where: { id: request.user.sub },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        account: true,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    request.user.accountId = user.account?.id ?? null;
    return {
      success: true,
      user: request.user,
    };
  }
}
