import { ToolDecorator as Tool, ExecutionContext, z, UseGuards } from '@nitrostack/core';
import { GetUserAccessTool } from './tools/getUserAccess.js';
import { RevokeAccountTool } from './tools/revokeAccount.js';
import { ReassignTicketsTool } from './tools/reassignTickets.js';
import { MarkEmployeeInactiveTool } from './tools/markEmployeeInactive.js';
import { AdminGuard } from '../../shared/guards/admin.guard.js';

/**
 * Offboarding tool class that aggregates all employee offboarding tools.
 * Each method delegates to the corresponding standalone tool class.
 */
export class OffboardingTools {

  @Tool({
    name: 'getUserAccess',
    description: 'Get the list of platforms and systems a user has access to',
    inputSchema: z.object({
      email: z.string().email().describe('The company email of the employee')
    })
  })
  async getUserAccess(input: { email: string }, ctx: ExecutionContext) {
    return new GetUserAccessTool().execute(input, ctx);
  }

  @Tool({
    name: 'revokeAccount',
    description: 'Revoke a user account on a given platform during offboarding',
    inputSchema: z.object({
      platform: z.string().describe('The platform to revoke access from'),
      email: z.string().email().describe('The company email of the employee')
    })
  })
  @UseGuards(AdminGuard)
  async revokeAccount(input: { platform: string; email: string }, ctx: ExecutionContext) {
    return new RevokeAccountTool().execute(input, ctx);
  }

  @Tool({
    name: 'reassignTickets',
    description: 'Reassign tickets from an offboarded employee to another employee',
    inputSchema: z.object({
      oldEmail: z.string().email().describe('The email of the employee leaving'),
      newEmail: z.string().email().describe('The email of the employee taking over')
    })
  })
  async reassignTickets(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
    return new ReassignTicketsTool().execute(input, ctx);
  }

  @Tool({
    name: 'markEmployeeInactive',
    description: 'Mark an employee as inactive in the system during offboarding',
    inputSchema: z.object({
      email: z.string().email().describe('The company email of the employee to mark inactive')
    })
  })
  @UseGuards(AdminGuard)
  async markEmployeeInactive(input: { email: string }, ctx: ExecutionContext) {
    return new MarkEmployeeInactiveTool().execute(input, ctx);
  }
}
