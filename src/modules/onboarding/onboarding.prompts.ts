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
        content: `Please onboard a new employee with the following details:
- Name: ${args.employee_name}
- Email: ${args.employee_email}
- Role: ${args.employee_role}
- Start Date: ${args.start_date}

Instructions for you (the AI Assistant):
1. First, execute the tool \`fetchRoleRequirements\` with role "${args.employee_role}" to get the required platforms and training modules.
2. Next, execute the tool \`createEmployee\` with name "${args.employee_name}", email "${args.employee_email}", role "${args.employee_role}", and startDate "${args.start_date}".
3. For each platform returned in step 1, execute \`provisionAccount\` with platform name and email "${args.employee_email}".
4. Execute \`assignTraining\` with email "${args.employee_email}" and the array of training modules returned in step 1.
5. Execute \`sendWelcomeEmail\` with email "${args.employee_email}".

Please run these tools back-to-back right now to update the database records.`
      }
    ];
  }
}
