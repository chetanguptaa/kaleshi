import { User } from '@repo/db';
import { type Request, type Response } from 'express';

export interface AppRequest extends Request {
  user?: Partial<User>;
}
