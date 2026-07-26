import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

export const mockUserDatabase = [
  { 
    email: "sarah@company.com", 
    status: "active", 
    accounts: ["Slack", "Google Workspace", "Jira", "GitHub"] 
  },
  { 
    email: "alex@company.com", 
    status: "active", 
    accounts: ["Slack", "Google Workspace"] 
  }
];

export class RevokeAccountTool {
  async execute(input: { platform: string; email: string; confirm?: boolean }, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('REVOKE_ACCOUNT');
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const cleanPlatform = (input.platform || '').trim();

    ctx.logger.info('Revoking account', { platform: cleanPlatform, email: cleanEmail });

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Validation Error: Invalid email format. Must contain "@"';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail || 'UNKNOWN',
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform || 'System',
        status: 'FAILED',
        details: err,
      });

      return {
        success: false,
        message: err,
        data: null
      };
    }

    if (!cleanPlatform) {
      const err = 'Validation Error: Platform name cannot be empty.';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: 'Unknown Platform',
        status: 'FAILED',
        details: err,
      });

      return {
        success: false,
        message: err,
        data: null
      };
    }

    try {
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

        await tracker.addStep('Find User', 'FAILED', errorMsg);
        await tracker.finishWorkflow();

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
          data: null
        };
      }

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

      await tracker.addStep('Revoke Account', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: user.email || cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform,
        status: wasRevoked ? 'SUCCESS' : 'NO_OP',
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
          fullUserState: user 
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to revoke account', { error: errMsg });

      await tracker.addStep('Revoke Account', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'REVOKE_ACCOUNT',
        system: cleanPlatform,
        status: 'FAILED',
        details: errMsg,
      });

      return {
        success: false,
        message: `Failed to revoke account: ${errMsg}`,
        data: null
      };
    }
  }
}
