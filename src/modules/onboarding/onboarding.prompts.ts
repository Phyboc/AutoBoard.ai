import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class OnboardingPrompts {

  @Prompt({
    name: 'onboard_employee',
    description: 'Autonomous orchestration prompt to onboard a new employee',
    arguments: [
      {
        name: 'employee_name',
        description: 'The name of the employee being onboarded',
        required: true
      },
      {
        name: 'employee_email',
        description: 'The email address of the employee',
        required: true
      },
      {
        name: 'employee_role',
        description: 'The job role/title (e.g., "Junior Frontend Developer")',
        required: true
      },
      {
        name: 'start_date',
        description: 'Start date for the employee',
        required: true
      }
    ]
  })
  async getOnboardingWorkflow(args: { employee_name: string; employee_email: string; employee_role: string; start_date: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Generating onboarding orchestration prompt for ${args.employee_name}`);

    return [
      {
        role: 'user' as const,
        content: `I want to onboard a new employee: ${args.employee_name} (${args.employee_email}) as a ${args.employee_role} starting on ${args.start_date}.`
      },
      {
        role: 'assistant' as const,
        content: `You are an orchestration AI responsible for onboarding this employee. 
Execute the following steps fully autonomously, invoking the necessary tools back-to-back:

1. Use \`fetchRoleRequirements\` for the role "${args.employee_role}" to determine the required platforms and training modules.
2. Use \`createEmployee\` to register the employee with name "${args.employee_name}", email "${args.employee_email}", role "${args.employee_role}", and start date "${args.start_date}".
3. For each platform returned in step 1, invoke \`provisionAccount\` with the platform name and email.
4. Invoke \`assignTraining\` passing the email and the array of training modules returned in step 1.
5. Invoke \`sendWelcomeEmail\` with the email.

Do not stop for human confirmation unless a tool fails unexpectedly and you need human intervention. Once all steps are complete, output a final summary markdown report to the user detailing the completed onboarding process.`
      }
    ];
  }
}
