import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class EmployeeLifecyclePrompts {

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
        content: 'How do I use the Employee Lifecycle system?'
      },
      {
        role: 'assistant' as const,
        content: `# Employee Lifecycle MCP Server\n\n` +
          `This server provides tools for automating employee onboarding and offboarding.\n\n` +
          `## Onboarding Workflow\n` +
          `1. \`fetchRoleRequirements\` - Get software/training/channels for a role\n` +
          `2. \`createEmployee\` - Register the new employee\n` +
          `3. \`provisionAccount\` - Set up platform accounts\n` +
          `4. \`assignTraining\` - Enroll in training modules\n` +
          `5. \`sendWelcomeEmail\` - Send welcome instructions\n\n` +
          `## Offboarding Workflow\n` +
          `1. \`getUserAccess\` - View current platform access\n` +
          `2. \`revokeAccount\` - Remove access from platforms\n` +
          `3. \`reassignTickets\` - Transfer outstanding work\n\n` +
          `TODO: Implement real workflow orchestration logic.`
      }
    ];
  }

  @Prompt({
    name: 'offboarding_help',
    description: 'Get help with employee offboarding workflow',
    arguments: [
      {
        name: 'employee_name',
        description: 'The name of the employee being offboarded (optional)',
        required: false
      }
    ]
  })
  async getOffboardingHelp(args: { employee_name?: string }, ctx: ExecutionContext) {
    ctx.logger.info('Generating offboarding help prompt');

    const employeeName = args.employee_name;

    if (employeeName) {
      return [
        {
          role: 'user' as const,
          content: `How do I offboard ${employeeName}?`
        },
        {
          role: 'assistant' as const,
          content: `# Offboarding Workflow for ${employeeName}\n\n` +
            `To offboard ${employeeName}, you would typically:\n\n` +
            `1. **Get user access** - See all platforms they have access to\n` +
            `2. **Revoke accounts** - Remove access from each platform\n` +
            `3. **Reassign tickets** - Transfer their tickets to another employee\n\n` +
            `TODO: Implement real offboarding orchestration logic.`
        }
      ];
    }

    return [
      {
        role: 'user' as const,
        content: 'How do I offboard an employee?'
      },
      {
        role: 'assistant' as const,
        content: `# Offboarding Workflow\n\n` +
          `1. \`getUserAccess\` - View current platform access\n` +
          `2. \`revokeAccount\` - Remove access from platforms\n` +
          `3. \`reassignTickets\` - Transfer outstanding work\n\n` +
          `TODO: Implement real offboarding orchestration logic.`
      }
    ];
  }
}
