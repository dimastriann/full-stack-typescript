import { Request, Response } from 'express';
import { User } from '../../user/entities/user.entity';

export interface GqlContext {
  req: Request & { user?: User };
  res: Response;
}
