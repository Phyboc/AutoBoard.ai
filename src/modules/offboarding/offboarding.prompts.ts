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
        content: `I want to offboard the employee with email ${args.employee_email} and reassign their tickets to ${args.reassign_email}.`
      },
      {
        role: 'assistant' as const,
        content: `You are an orchestration AI responsible for offboarding this employee.
Execute the following steps fully autonomously, invoking the necessary tools back-to-back:

1. Use \`getUserAccess\` with the email "${args.employee_email}" to see all the platforms they have access to.
2. For each platform returned in step 1, invoke \`revokeAccount\` with the platform name and the email "${args.employee_email}".
3. Invoke \`reassignTickets\` with \`oldEmail\` as "${args.employee_email}" and \`newEmail\` as "${args.reassign_email}".
4. Invoke \`markEmployeeInactive\` with the email "${args.employee_email}".

Do not stop for human confirmation unless a tool fails unexpectedly and you need human intervention. Once all steps are complete, output a final summary markdown report to the user detailing the completed offboarding process.`
      }
    ];
  }
}
