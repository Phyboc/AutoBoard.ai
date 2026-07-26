import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

interface GetUserAccessInput {
  email: string;
}

export class GetUserAccessTool {
  async execute(input: GetUserAccessInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('GET_USER_ACCESS');
    ctx.logger.info('Fetching user access', { email: input.email });

    const targetIdentifier = (input.email || '').toLowerCase().trim();

    if (!targetIdentifier) {
      const errMsg = 'Email or user identifier must be provided.';
      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'GET_USER_ACCESS',
        system: 'Identity Provider',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: { email: input.email, name: '', platforms: [] }
      };
    }

    try {
      const employees = (await readDB('employees.json')) || [];

      const employee = employees.find(
        (e: any) =>
          e.email?.toLowerCase() === targetIdentifier ||
          e.id?.toLowerCase() === targetIdentifier ||
          e.name?.toLowerCase().includes(targetIdentifier)
      );

      if (!employee) {
        const notFoundMsg = `User '${input.email}' not found.`;
        ctx.logger.warn(`User matching '${input.email}' not found in database`);

        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetIdentifier,
          action: 'GET_USER_ACCESS',
          system: 'Identity Provider',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: { email: input.email, name: '', platforms: [] }
        };
      }

      const platforms: string[] = employee.provisionedAccounts || employee.accounts || [];
      ctx.logger.info(`Found ${platforms.length} active platform(s) for ${employee.email}`);

      await tracker.addStep('Get User Access', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: employee.email,
        action: 'GET_USER_ACCESS',
        system: 'Identity Provider',
        status: 'SUCCESS',
        details: `Retrieved ${platforms.length} active platform(s) for ${employee.name}`
      });

      return {
        success: true,
        message: `Retrieved active platforms for ${employee.name}`,
        data: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          status: employee.status,
          platforms
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to get user access', { error: errMsg });

      await tracker.addStep('Get User Access', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: targetIdentifier,
        action: 'GET_USER_ACCESS',
        system: 'Identity Provider',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to get user access: ${errMsg}`,
        data: { email: input.email, name: '', platforms: [] }
      };
    }
  }
}
