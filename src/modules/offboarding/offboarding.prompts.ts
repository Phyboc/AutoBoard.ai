// import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

// export class OffboardingPrompts {

//   @Prompt({
//     name: 'offboard_employee',
//     description: 'Autonomous orchestration prompt to offboard an employee',
//     arguments: [
//       {
//         name: 'employee_email',
//         description: 'The company email of the employee to offboard',
//         required: true
//       },
//       {
//         name: 'reassign_email',
//         description: 'The email address of the employee taking over the tickets',
//         required: true
//       }
//     ]
//   })
//   async getOffboardingWorkflow(args: { employee_email: string; reassign_email: string }, ctx: ExecutionContext) {
//     ctx.logger.info(`Generating offboarding orchestration prompt for ${args.employee_email}`);

//     return [
//       {
//         role: 'user' as const,
//         content: `Please offboard the employee with email ${args.employee_email} and reassign their tickets to ${args.reassign_email}.

// Instructions for you (the AI Assistant):
// 1. First, execute \`getUserAccess\` with email "${args.employee_email}" to see all their assigned platforms.
// 2. For each platform returned in step 1, execute \`revokeAccount\` with the platform name and email "${args.employee_email}".
// 3. Execute \`reassignTickets\` with oldEmail as "${args.employee_email}" and newEmail as "${args.reassign_email}".
// 4. Execute \`markEmployeeInactive\` with email "${args.employee_email}".

// Please run these tools back-to-back right now to update the database records.`
//       }
//     ];
//   }
// }



import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';
import { GetUserAccessTool } from '../../tools/offboarding/getUserAccess.js';
import { RevokeAccountTool } from '../../tools/offboarding/revokeAccount.js';
import { ReassignTicketsTool } from '../../tools/offboarding/reassignTickets.js';
import { MarkEmployeeInactiveTool } from '../../tools/offboarding/markEmployeeInactive.js';

export class OffboardingPrompts {

  @Prompt({
    name: 'offboard_employee',
    description: 'Autonomous orchestration prompt to offboard an employee',
    arguments: [
      { name: 'employee_email', description: 'The company email of the employee to offboard', required: true },
      { name: 'reassign_email', description: 'The email address of the employee taking over tickets', required: true }
    ]
  })
  async getOffboardingWorkflow(args: { employee_email: string; reassign_email: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Executing autonomous offboarding for ${args.employee_email}`);

    try {
      // 1. Get user access to see assigned platforms
      const userAccess: any = await new GetUserAccessTool().execute({ email: args.employee_email }, ctx);
      const platforms = userAccess?.platforms || ['Google Workspace', 'Slack', 'GitHub'];

      // 2. Revoke account for each platform
      for (const platform of platforms) {
        await new RevokeAccountTool().execute({ platform, email: args.employee_email }, ctx);
      }

      // 3. Reassign tickets
      await new ReassignTicketsTool().execute({ oldEmail: args.employee_email, newEmail: args.reassign_email }, ctx);

      // 4. Mark employee inactive
      await new MarkEmployeeInactiveTool().execute({ email: args.employee_email }, ctx);

      return [
        {
          role: 'assistant' as const,
          content: `# ✅ Offboarding Completed Successfully!\n\n` +
            `- **Offboarded Employee:** ${args.employee_email}\n` +
            `- **Revoked Platforms:** ${platforms.join(', ')}\n` +
            `- **Tickets Reassigned To:** ${args.reassign_email}\n\n` +
            `All databases (` + '`tickets.json`, `audit.json`, `execution.json`' + `) have been successfully updated.`
        }
      ];

    } catch (error: any) {
      ctx.logger.error(`Offboarding execution failed: ${error.message}`);
      return [
        {
          role: 'assistant' as const,
          content: `❌ **Offboarding Failed:** ${error.message}`
        }
      ];
    }
  }
}