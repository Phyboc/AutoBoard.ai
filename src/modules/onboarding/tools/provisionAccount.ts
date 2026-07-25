import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';
import { Employee } from './createEmployee.js';

interface ProvisionInput {
  email?: string;
  employeeId?: string;
  platform?: string;
  softwareList?: string[];
}

export class ProvisionAccountTool {
  async execute(input: ProvisionInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('PROVISION_ACCOUNT');
    const targetIdentifier = (input.email || input.employeeId || '').toLowerCase();

    ctx.logger.info('Provisioning accounts', { 
      email: String(input.email ?? ''), 
      platform: String(input.platform ?? '') 
    });

    if (!targetIdentifier) {
      const errMsg = 'Either email or employeeId must be provided.';
      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'PROVISION_ACCOUNT',
        system: input.platform || input.softwareList?.join(', ') || 'UNKNOWN',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: { provisioned: [] }
      };
    }

    try {
      const employees: Employee[] = (await readDB('employees.json')) || [];

      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === targetIdentifier ||
          e.id.toLowerCase() === targetIdentifier ||
          e.name.toLowerCase().includes(targetIdentifier)
      );

      if (!emp) {
        const notFoundMsg = `Employee matching '${targetIdentifier}' was not found.`;
        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetIdentifier,
          action: 'PROVISION_ACCOUNT',
          system: input.platform || input.softwareList?.join(', ') || 'UNKNOWN',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: { provisioned: [] }
        };
      }

      const itemsToProvision: string[] = [];
      if (input.platform) itemsToProvision.push(input.platform);
      if (input.softwareList && Array.isArray(input.softwareList)) {
        itemsToProvision.push(...input.softwareList);
      }

      if (itemsToProvision.length === 0) {
        const noItemMsg = 'No platform or software specified to provision.';
        await tracker.addStep('Specify Software', 'FAILED', noItemMsg);
        await tracker.finishWorkflow();

        return {
          success: false,
          message: noItemMsg,
          data: { provisioned: emp.provisionedAccounts || [] }
        };
      }

      emp.provisionedAccounts = Array.from(
        new Set([...(emp.provisionedAccounts || []), ...itemsToProvision])
      );

      await writeDB('employees.json', employees);

      ctx.logger.info('Accounts successfully provisioned', { employeeId: emp.id, provisioned: itemsToProvision });

      await tracker.addStep('Provision Accounts', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: emp.email,
        action: 'ACCOUNT_PROVISIONED',
        system: itemsToProvision.join(', '),
        status: 'SUCCESS',
        details: `Provisioned accounts [${itemsToProvision.join(', ')}] for ${emp.name}`
      });

      return {
        success: true,
        message: `Successfully provisioned [${itemsToProvision.join(', ')}] for ${emp.name}`,
        data: {
          employeeId: emp.id,
          name: emp.name,
          email: emp.email,
          provisioned: emp.provisionedAccounts
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to provision accounts', { error: errMsg });

      await tracker.addStep('Provision Accounts', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: targetIdentifier,
        action: 'ACCOUNT_PROVISIONED',
        system: input.platform || input.softwareList?.join(', ') || 'UNKNOWN',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to provision accounts: ${errMsg}`,
        data: { provisioned: [] }
      };
    }
  }
}
