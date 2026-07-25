import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class OnboardingPrompts {

  @Prompt({
    name: 'onboarding_help',
    description: 'Get help with employee onboarding workflow',
    arguments: [
      {
        name: 'employee_name',
        description: 'The name of the employee being onboarded (optional)',
        required: false
      }
    ]
  })
  async getOnboardingHelp(args: { employee_name?: string }, ctx: ExecutionContext) {
    ctx.logger.info('Generating onboarding help prompt');

    const employeeName = args.employee_name;

    if (employeeName) {
      return [
        {
          role: 'user' as const,
          content: `How do I onboard ${employeeName}?`
        },
        {
          role: 'assistant' as const,
          content: `# Onboarding Workflow for ${employeeName}\n\n` +
            `To onboard ${employeeName}, you would typically:\n\n` +
            `1. **Fetch role requirements** - Look up required software, training, and channels\n` +
            `2. **Create employee profile** - Register them in the system\n` +
            `3. **Provision accounts** - Set up accounts on all required platforms\n` +
            `4. **Assign training** - Enroll them in mandatory training modules\n` +
            `5. **Send welcome email** - Notify them with onboarding instructions\n\n` +
            `TODO: Implement real onboarding orchestration logic.`
        }
      ];
    }

    return [
      {
        role: 'user' as const,
        content: 'How do I use the Employee Onboarding system?'
      },
      {
        role: 'assistant' as const,
        content: `# Employee Onboarding\n\n` +
          `This module provides tools for automating employee onboarding.\n\n` +
          `## Onboarding Workflow\n` +
          `1. \`fetchRoleRequirements\` - Get software/training/channels for a role\n` +
          `2. \`createEmployee\` - Register the new employee\n` +
          `3. \`provisionAccount\` - Set up platform accounts\n` +
          `4. \`assignTraining\` - Enroll in training modules\n` +
          `5. \`sendWelcomeEmail\` - Send welcome instructions\n\n` +
          `TODO: Implement real onboarding orchestration logic.`
      }
    ];
  }
}
