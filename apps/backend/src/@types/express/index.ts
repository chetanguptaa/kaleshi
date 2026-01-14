import { type Request } from 'express';

export interface IRequestUser {
  sub: number;
  roles: string[];
  sid: string;
}

export interface AppRequest extends Request {
  user: IRequestUser;
}
