import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../utils/db.js';
import { logAudit } from '../../utils/auditLogger.js';

interface ProvisionInput {
  email?: string;
  employeeId?: string;
  platform?: string;
  softwareList?: string[];
}

export class ProvisionAccountTool {
  async execute(input: ProvisionInput, ctx: ExecutionContext) {
    ctx.logger.info('Provisioning accounts', { 
      email: String(input.email ?? ''), 
      platform: String(input.platform ?? '') 
    });

    const targetIdentifier = (input.email || input.employeeId || '').toLowerCase();

    if (!targetIdentifier) {
      return {
        success: false,
        message: 'Either email or employeeId must be provided.',
        data: { provisioned: [] }
      };
    }

    try {
      const employees = (await readDB('employees.json')) || [];

      const emp = employees.find(
        (e: any) =>
          e.email?.toLowerCase() === targetIdentifier ||
          e.id?.toLowerCase() === targetIdentifier ||
          e.name?.toLowerCase().includes(targetIdentifier)
      );

      if (!emp) {
        const notFoundMsg = `Employee matching '${targetIdentifier}' was not found.`;
        
        await logAudit({
          employee: targetIdentifier,
          action: 'ACCOUNT_PROVISIONED',
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

      // Consolidate target platforms
      const itemsToProvision: string[] = [];
      if (input.platform) itemsToProvision.push(input.platform);
      if (input.softwareList && Array.isArray(input.softwareList)) {
        itemsToProvision.push(...input.softwareList);
      }

      if (itemsToProvision.length === 0) {
        return {
          success: false,
          message: 'No platform or software specified to provision.',
          data: { provisioned: emp.provisionedAccounts || [] }
        };
      }

      // Add to provisionedAccounts without duplicates
      emp.provisionedAccounts = Array.from(
        new Set([...(emp.provisionedAccounts || []), ...itemsToProvision])
      );

      await writeDB('employees.json', employees);

      ctx.logger.info('Accounts successfully provisioned', { employeeId: emp.id, provisioned: itemsToProvision });

      // ✅ SUCCESS AUDIT LOG
      await logAudit({
        employee: emp.email,
        action: 'ACCOUNT_PROVISIONED',
        system: itemsToProvision.join(', '),
        status: 'SUCCESS'
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
      ctx.logger.error('Failed to provision accounts', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG
      await logAudit({
        employee: targetIdentifier,
        action: 'ACCOUNT_PROVISIONED',
        system: input.platform || input.softwareList?.join(', ') || 'UNKNOWN',
        status: 'FAILED',
        details: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to provision accounts: ${(error as Error).message}`,
        data: { provisioned: [] }
      };
    }
  }
}