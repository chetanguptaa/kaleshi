import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppRequest } from '../@types/express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const req: AppRequest = ctx.switchToHttp().getRequest();
    const token: string = req.cookies?.auth as string;
    if (!token) throw new UnauthorizedException('Missing auth token');
    const user = await this.authService.verifyToken(token);
    if (!user) throw new UnauthorizedException('Invalid token');
    req.user = user;
    return true;
  }
}
