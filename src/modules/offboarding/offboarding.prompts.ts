import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';
import { GetUserAccessTool } from '../../tools/offboarding/getUserAccess.js';
import { RevokeAccountTool } from '../../tools/offboarding/revokeAccount.js';
import { ReassignTicketsTool } from '../../tools/offboarding/reassignTickets.js';
import { MarkEmployeeInactiveTool } from '../../tools/offboarding/markEmployeeInactive.js';
import * as fs from 'fs';
import * as path from 'path';

export class OffboardingPrompts {

  @Prompt({
    name: 'offboard_employee',
    description: 'Autonomous orchestration prompt to offboard an employee with live updates',
    arguments: [
      { name: 'employee_email', description: 'The company email of the employee to offboard', required: true },
      { name: 'reassign_email', description: 'The email address of the employee taking over tickets', required: true }
    ]
  })
  async getOffboardingWorkflow(args: { employee_email: string; reassign_email: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Starting live offboarding for ${args.employee_email}`);

    const dbPath = path.resolve(process.cwd(), 'data/offboarding.json');

    const updateState = (status: string, revokedSystems: any[], ticketDone: boolean) => {
      const payload = {
        employeeName: args.employee_email,
        status: status,
        revokedSystems: revokedSystems,
        ticketReassignment: {
          count: 5,
          assignedTo: args.reassign_email,
          done: ticketDone
        }
      };
      if (!fs.existsSync(path.dirname(dbPath))) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(payload, null, 2));
    };

    // STEP 1: Initial Draft (Shows systems as un-revoked / NA initially)
    updateState('In Progress', [
      { name: 'Google Workspace', revoked: false },
      { name: 'Slack', revoked: false },
      { name: 'GitHub', revoked: false }
    ], false);

    try {
      // STEP 2: Get Access
      const userAccess: any = await new GetUserAccessTool().execute({ email: args.employee_email }, ctx);
      const platforms = userAccess?.platforms || ['Google Workspace', 'Slack', 'GitHub'];

      // STEP 3: Revoke accounts one by one with live UI updates
      const revokedList = platforms.map((p: string) => ({ name: p, revoked: false }));
      
      for (let i = 0; i < revokedList.length; i++) {
        await new RevokeAccountTool().execute({ platform: revokedList[i].name, email: args.employee_email, confirm: true }, ctx);
        revokedList[i].revoked = true;
        updateState('In Progress', [...revokedList], false);
      }

      // STEP 4: Reassign Tickets
      await new ReassignTicketsTool().execute({ oldEmail: args.employee_email, newEmail: args.reassign_email, confirm: true }, ctx);
      updateState('In Progress', revokedList.map((r: { name: string; revoked: boolean }) => ({ ...r, revoked: true })), true);

      // STEP 5: Mark Inactive
      await new MarkEmployeeInactiveTool().execute({ email: args.employee_email, confirm: true }, ctx);

      // FINAL STATE: Completed
      updateState('Completed', revokedList.map((r: { name: string; revoked: boolean }) => ({ ...r, revoked: true })), true);

      return [
        {
          role: 'assistant' as const,
          content: `✅ Offboarding completed for ${args.employee_email}.`
        }
      ];

    } catch (error: any) {
      updateState('Pending', [], false);
      throw error;
    }
  }
}