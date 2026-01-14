import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { z } from 'zod';
import { AuthGuard } from './auth.guard';
import { type Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { type AppRequest } from '../@types/express';

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() raw: any, @Res({ passthrough: true }) res: Response) {
    const parsed = await signupSchema.safeParseAsync(raw);
    if (!parsed.success) {
      throw parsed.error;
    }
    const { name, email, password } = parsed.data;
    const { token, user } = await this.authService.signup(
      name,
      email,
      password,
    );
    res.cookie('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: { id: user.id, name: user.name, email: user.email } };
  }

  @Post('login')
  async login(@Body() raw: any, @Res({ passthrough: true }) res: Response) {
    const parsed = await loginSchema.safeParseAsync(raw);
    if (!parsed.success) {
      throw parsed.error;
    }
    const { email, password } = parsed.data;
    const { token, user } = await this.authService.login(email, password);
    res.cookie('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: { id: user.id, name: user.name, email: user.email } };
  }

  @Post('logout')
  async logout(
    @Req() req: AppRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token: string = req.cookies?.auth as string;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          sid: string;
        };
        await this.authService.logout(decoded.sid);
      } catch {
        // ignore invalid token
      }
    }
    res.clearCookie('auth');
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(req: AppRequest) {
    return { user: req.user };
  }
}
