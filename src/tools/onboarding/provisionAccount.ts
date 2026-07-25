// import { ExecutionContext } from '@nitrostack/core';

// export class ProvisionAccountTool {
//   async execute(input: { platform: string; email: string }, ctx: ExecutionContext) {
//     ctx.logger.info('Provisioning account', { platform: input.platform, email: input.email });

//     // TODO: Implement real account provisioning via platform APIs
//     return {
//       success: true,
//       message: `TODO: Implement provisioning ${input.platform} account for ${input.email}`,
//       data: {
//         platform: input.platform,
//         email: input.email,
//         status: 'Provisioned'
//       }
//     };
//   }
// }


import { ExecutionContext } from '@nitrostack/core';
import { readFile, writeFile } from 'node:fs/promises';
import { getResourcePath } from '../utils.js';
import { Employee } from './createEmployee.js';

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

    try {
      const filePath = getResourcePath('employees.json');
      const fileData = await readFile(filePath, 'utf-8');
      const employees: Employee[] = JSON.parse(fileData);

      // Identify target employee by email, employeeId, or matching term
      const targetIdentifier = (input.email || input.employeeId || '').toLowerCase();

      if (!targetIdentifier) {
        return {
          success: false,
          message: 'Either email or employeeId must be provided.',
          data: { provisioned: [] }
        };
      }

      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === targetIdentifier ||
          e.id.toLowerCase() === targetIdentifier ||
          e.name.toLowerCase().includes(targetIdentifier)
      );

      if (!emp) {
        return {
          success: false,
          message: `Employee matching '${targetIdentifier}' was not found.`,
          data: { provisioned: [] }
        };
      }

      // Consolidate platforms/softwareList into a single array
      const itemsToProvision: string[] = [];
      if (input.platform) itemsToProvision.push(input.platform);
      if (input.softwareList && Array.isArray(input.softwareList)) {
        itemsToProvision.push(...input.softwareList);
      }

      if (itemsToProvision.length === 0) {
        return {
          success: false,
          message: 'No platform or software specified to provision.',
          data: { provisioned: emp.provisionedAccounts }
        };
      }

      // Add to provisionedAccounts without duplicates
      emp.provisionedAccounts = Array.from(
        new Set([...emp.provisionedAccounts, ...itemsToProvision])
      );

      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      ctx.logger.info('Accounts successfully provisioned', { employeeId: emp.id, provisioned: itemsToProvision });

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
      return {
        success: false,
        message: `Failed to provision accounts: ${(error as Error).message}`,
        data: { provisioned: [] }
      };
    }
  }
}
