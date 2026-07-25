import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';
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
  @Tool({
    name: 'provisionAccount',
    description: 'Provisions software platforms or tool access for an employee.',
    inputSchema: z.object({
      email: z
        .string()
        .email('Invalid email address format (must contain @)')
        .optional(),
      employeeId: z.string().optional(),
      platform: z.string().min(1, 'Platform cannot be empty string').optional(),
      softwareList: z.array(z.string().min(1)).optional(),
    }),
  })
  async execute(input: ProvisionInput, ctx: ExecutionContext) {
    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    const targetIdentifier = (input.email || input.employeeId || '').trim();

    if (!targetIdentifier) {
      throw new Error('Validation Error: Either email or employeeId must be provided.');
    }

    if (input.email && !input.email.includes('@')) {
      throw new Error('Validation Error: Invalid email format. Must contain "@"');
    }

    const itemsToProvision: string[] = [];
    if (input.platform && input.platform.trim()) {
      itemsToProvision.push(input.platform.trim());
    }
    if (input.softwareList && Array.isArray(input.softwareList)) {
      itemsToProvision.push(...input.softwareList.filter((s) => s.trim().length > 0));
    }

    if (itemsToProvision.length === 0) {
      throw new Error('Validation Error: At least one non-empty platform or software item must be specified.');
    }

    ctx.logger.info('Provisioning accounts', {
      identifier: targetIdentifier,
      items: itemsToProvision,
    });

    // ==========================================
    // 2. FILE PERSISTENCE & EXECUTION LOGIC
    // ==========================================
    try {
      const filePath = getResourcePath('employees.json');
      const fileData = await readFile(filePath, 'utf-8');
      const employees: Employee[] = JSON.parse(fileData);

      const targetSearch = targetIdentifier.toLowerCase();
      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === targetSearch ||
          e.id.toLowerCase() === targetSearch ||
          e.name.toLowerCase().includes(targetSearch)
      );

      if (!emp) {
        return {
          success: false,
          message: `Employee matching '${targetIdentifier}' was not found.`,
          data: { provisioned: [] },
        };
      }

      // Add to provisionedAccounts without duplicates
      emp.provisionedAccounts = Array.from(
        new Set([...emp.provisionedAccounts, ...itemsToProvision])
      );

      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      ctx.logger.info('Accounts successfully provisioned', {
        employeeId: emp.id,
        provisioned: itemsToProvision,
      });

      return {
        success: true,
        message: `Successfully provisioned [${itemsToProvision.join(', ')}] for ${emp.name}`,
        data: {
          employeeId: emp.id,
          name: emp.name,
          email: emp.email,
          provisioned: emp.provisionedAccounts,
        },
      };
    } catch (error) {
      ctx.logger.error('Failed to provision accounts', {
        error: (error as Error).message,
      });

      return {
        success: false,
        message: `Failed to provision accounts: ${(error as Error).message}`,
        data: { provisioned: [] },
      };
    }
  }
}