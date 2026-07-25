import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';

// 1. Hackathon Mock Identity Database
export const mockUserDatabase = [
  {
    email: 'sarah@company.com',
    status: 'active',
    accounts: ['Slack', 'Google Workspace', 'Jira', 'GitHub'],
  },
  {
    email: 'alex@company.com',
    status: 'active',
    accounts: ['Slack', 'Google Workspace'],
  },
];

export class RevokeAccountTool {
  @Tool({
    name: 'revokeAccount',
    description: 'Revokes access for an employee on a specified platform.',
    inputSchema: z.object({
      platform: z.string().min(1, 'Platform name cannot be empty'),
      email: z.string().email('Invalid email address format (must contain @)'),
      confirm: z
        .boolean()
        .default(false)
        .describe('Set to true only after the user explicitly confirms revocation.'),
    }),
  })
  async execute(
    input: { platform: string; email: string; confirm?: boolean },
    ctx: ExecutionContext
  ) {
    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Validation Error: Invalid email format. Must contain "@"');
    }

    if (!input.platform || !input.platform.trim()) {
      throw new Error('Validation Error: Platform name cannot be empty.');
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPlatform = input.platform.trim();

    // ==========================================
    // 2. CONFIRMATION SAFETY GUARD
    // ==========================================
    if (!input.confirm) {
      ctx.logger.warn('Revocation halted: Confirmation required', {
        email: cleanEmail,
        platform: cleanPlatform,
      });

      return {
        success: false,
        requiresConfirmation: true,
        message: `PERMANENT ACTION WARNING: You are about to revoke ${cleanPlatform} access for ${cleanEmail}. Please confirm to proceed.`,
        data: {
          platform: cleanPlatform,
          email: cleanEmail,
          status: 'Pending Confirmation',
        },
      };
    }

    ctx.logger.info('Revoking account', {
      platform: cleanPlatform,
      email: cleanEmail,
    });

    // ==========================================
    // 3. EXECUTION & STATE REVOCATION
    // ==========================================
    const user = mockUserDatabase.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const errorMsg = `User ${cleanEmail} not found in the employee directory.`;
      ctx.logger.warn(errorMsg);
      return {
        success: false,
        message: errorMsg,
        data: null,
      };
    }

    const accountIndex = user.accounts.findIndex(
      (acc) => acc.toLowerCase() === cleanPlatform.toLowerCase()
    );

    let wasRevoked = false;

    if (accountIndex > -1) {
      user.accounts.splice(accountIndex, 1);
      wasRevoked = true;
    }

    const message = wasRevoked
      ? `Successfully revoked ${cleanPlatform} access for ${cleanEmail}.`
      : `No action taken. ${cleanEmail} did not have active access to ${cleanPlatform}.`;

    ctx.logger.info(message);

    return {
      success: true,
      message,
      data: {
        platform: cleanPlatform,
        email: cleanEmail,
        status: wasRevoked ? 'Revoked' : 'Not Provisioned',
        remainingAccounts: user.accounts,
        fullUserState: user,
      },
    };
  }
}