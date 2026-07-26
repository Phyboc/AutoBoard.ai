import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class OffboardingPrompts {

  @Prompt({
    name: 'offboard_employee',
    description: 'Autonomous orchestration prompt to offboard an employee',
    arguments: [
      {
        name: 'employee_email',
        description: 'The company email of the employee to offboard',
        required: true
      },
      {
        name: 'reassign_email',
        description: 'The email address of the employee taking over the tickets',
        required: true
      }
    ]
  })
  async getOffboardingWorkflow(args: { employee_email: string; reassign_email: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Generating offboarding orchestration prompt for ${args.employee_email}`);

    return [
      {
        role: 'user' as const,
        content: `Please offboard the employee with email ${args.employee_email} and reassign their tickets to ${args.reassign_email}.

Instructions for you (the AI Assistant):
1. First, execute \`getUserAccess\` with email "${args.employee_email}" to see all their assigned platforms.
2. For each platform returned in step 1, execute \`revokeAccount\` with the platform name and email "${args.employee_email}".
3. Execute \`reassignTickets\` with oldEmail as "${args.employee_email}" and newEmail as "${args.reassign_email}".
4. Execute \`markEmployeeInactive\` with email "${args.employee_email}".

Please run these tools back-to-back right now to update the database records.`
      }
    ];
  }
}
