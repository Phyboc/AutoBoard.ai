import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

export class OffboardingPrompts {

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
            `3. **Reassign tickets** - Transfer their tickets to another employee\n` +
            `4. **Mark employee inactive** - Update their status in the database to Inactive\n\n` +
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
          `3. \`reassignTickets\` - Transfer outstanding work\n` +
          `4. \`markEmployeeInactive\` - Set status to Inactive in database\n\n` +
          `TODO: Implement real offboarding orchestration logic.`
      }
    ];
  }
}
