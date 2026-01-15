import { type Request } from 'express';

export interface IRequestUser {
  sub: number;
  roles: number[];
  accountId: string | null;
  sid: string;
}

export interface AppRequest extends Request {
  user: IRequestUser;
}
