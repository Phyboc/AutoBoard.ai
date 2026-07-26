import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

export interface RoleRequirements {
  software: string[];
  training: string[];
  channels: string[];
}

export class FetchRoleRequirementsTool {
  async execute(input: { role: string }, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('FETCH_ROLE_REQUIREMENTS');
    ctx.logger.info('Fetching role requirements', { role: input.role });

    try {
      const rolesMap = (await readDB('roles.json')) || {};

      const defaultRequirements: RoleRequirements = {
        software: ['Google Workspace', 'Slack'],
        training: ['Security Training'],
        channels: ['#general']
      };

      const requirements: RoleRequirements = rolesMap[input.role] || defaultRequirements;

      ctx.logger.info('Successfully fetched role requirements', { role: input.role });

      await tracker.addStep('Fetch Role Requirements', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'SYSTEM',
        action: 'FETCH_ROLE_REQUIREMENTS',
        system: 'Role Repository',
        status: 'SUCCESS',
        details: `Fetched requirements for role: ${input.role}`
      });

      return {
        success: true,
        message: `Successfully retrieved requirements for ${input.role}`,
        data: {
          role: input.role,
          software: requirements.software,
          training: requirements.training,
          channels: requirements.channels
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to read roles.json', { error: errMsg });

      await tracker.addStep('Fetch Role Requirements', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'SYSTEM',
        action: 'FETCH_ROLE_REQUIREMENTS',
        system: 'Role Repository',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to load role requirements: ${errMsg}`,
        data: {
          role: input.role,
          software: [],
          training: [],
          channels: []
        }
      };
    }
  }
}
