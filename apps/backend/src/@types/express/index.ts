import { type Request } from 'express';
import { User } from 'generated/prisma/client';

export interface AppRequest extends Request {
  user?: Partial<User>;
}
