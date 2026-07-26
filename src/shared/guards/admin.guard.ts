import { Guard, ExecutionContext, Injectable } from '@nitrostack/core';

@Injectable()
export class AdminGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userRoles = (context.metadata?.roles as string[]) || [];
    return userRoles.includes('admin');
  }
}
