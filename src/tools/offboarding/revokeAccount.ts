import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../utils/db.js';
import { logAudit } from '../../utils/auditLogger.js';

// Fallback Mock Identity Database
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
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const cleanPlatform = (input.platform || '').trim();

    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Validation Error: Invalid email format. Must contain "@"';

      await logAudit({
        employee: cleanEmail || 'UNKNOWN',
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform || 'System',
        status: 'FAILED',
        details: err,
      });

      throw new Error(err);
    }

    if (!cleanPlatform) {
      const err = 'Validation Error: Platform name cannot be empty.';

      await logAudit({
        employee: cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: 'Unknown Platform',
        status: 'FAILED',
        details: err,
      });

      throw new Error(err);
    }

    // ==========================================
    // 2. CONFIRMATION SAFETY GUARD
    // ==========================================
    if (!input.confirm) {
      ctx.logger.warn('Revocation halted: Confirmation required', {
        email: cleanEmail,
        platform: cleanPlatform,
      });

      await logAudit({
        employee: cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform,
        status: 'WAITING_CONFIRMATION',
        details: `Revocation halted pending user confirmation for ${cleanPlatform}`,
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

    try {
      // ==========================================
      // 3. EXECUTION & STATE REVOCATION
      // ==========================================
      const employees = (await readDB('employees.json')) || mockUserDatabase;

      const user = employees.find(
        (u: any) =>
          u.email?.toLowerCase() === cleanEmail ||
          u.id?.toLowerCase() === cleanEmail ||
          u.name?.toLowerCase().includes(cleanEmail)
      );

      if (!user) {
        const errorMsg = `User '${cleanEmail}' not found in the employee directory.`;
        ctx.logger.warn(errorMsg);

        // ❌ FAILURE AUDIT LOG (User Not Found)
        await logAudit({
          employee: cleanEmail,
          action: 'REVOKE_ACCOUNT',
          system: cleanPlatform,
          status: 'FAILED',
          details: errorMsg,
        });

        return {
          success: false,
          message: errorMsg,
          data: null,
        };
      }

      // Check both schema variants: provisionedAccounts and accounts
      const accountsList: string[] = user.provisionedAccounts || user.accounts || [];

      const accountIndex = accountsList.findIndex(
        (acc) => acc.toLowerCase() === cleanPlatform.toLowerCase()
      );

      let wasRevoked = false;

      if (accountIndex > -1) {
        accountsList.splice(accountIndex, 1);
        if (user.provisionedAccounts) user.provisionedAccounts = accountsList;
        if (user.accounts) user.accounts = accountsList;
        wasRevoked = true;

        await writeDB('employees.json', employees);
      }

      const message = wasRevoked
        ? `Successfully revoked ${cleanPlatform} access for ${cleanEmail}.`
        : `No action taken. ${cleanEmail} did not have active access to ${cleanPlatform}.`;

      ctx.logger.info(message);

      // ✅ SUCCESS AUDIT LOG
      await logAudit({
        employee: user.email || cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform,
        status: wasRevoked ? 'SUCCESS' : 'FAILED',
        details: message,
      });

      return {
        success: true,
        message,
        data: {
          platform: cleanPlatform,
          email: user.email || cleanEmail,
          status: wasRevoked ? 'Revoked' : 'Not Provisioned',
          remainingAccounts: accountsList,
          fullUserState: user,
        },
      };
    } catch (error) {
      ctx.logger.error('Failed to revoke account', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG (Exception)
      await logAudit({
        employee: cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform,
        status: 'FAILED',
        details: (error as Error).message,
      });

      throw error;
    }
  }
}