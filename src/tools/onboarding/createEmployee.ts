import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';
import { readFile, writeFile } from 'node:fs/promises';
import { getResourcePath } from '../utils.js';
import { logAudit } from '../../utils/auditLogger.js'; // Added Audit Logger

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  startDate: string;
  status: 'Onboarding' | 'Active' | 'Offboarded';
  provisionedAccounts: string[];
  assignedTraining: string[];
}

export class CreateEmployeeTool {
  @Tool({
    name: 'createEmployee',
    description: 'Creates a new employee profile and saves it to local persistence.',
    inputSchema: z.object({
      name: z.string().min(1, 'Employee name cannot be empty'),
      email: z
        .string()
        .email('Invalid email address format (must contain @)')
        .optional(),
      role: z.string().min(1, 'Role cannot be empty'),
      startDate: z.string().min(1, 'Start date cannot be empty'),
    }),
  })
  async execute(
    input: { name: string; email?: string; role: string; startDate: string },
    ctx: ExecutionContext
  ) {
    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    if (!input.name || !input.name.trim()) {
      throw new Error('Validation Error: Employee name cannot be empty.');
    }

    if (!input.role || !input.role.trim()) {
      throw new Error('Validation Error: Employee role cannot be empty.');
    }

    const email =
      input.email?.trim() ||
      `${input.name.toLowerCase().replace(/\s+/g, '.')}@company.com`;

    if (!email.includes('@')) {
      throw new Error('Validation Error: Invalid email format. Must contain "@"');
    }

    ctx.logger.info('Creating employee profile', {
      name: input.name,
      role: input.role,
      email,
    });

    // ==========================================
    // 2. FILE PERSISTENCE LOGIC
    // ==========================================
    try {
      const filePath = getResourcePath('employees.json');

      let employees: Employee[] = [];
      try {
        const fileData = await readFile(filePath, 'utf-8');
        employees = JSON.parse(fileData);
      } catch (readError) {
        ctx.logger.warn('employees.json missing or unreadable, starting empty', {
          error: (readError as Error).message,
        });
      }

      const id = `emp-${Date.now().toString().slice(-4)}`;

      const newEmployee: Employee = {
        id,
        name: input.name.trim(),
        email,
        role: input.role.trim(),
        startDate: input.startDate,
        status: 'Onboarding',
        provisionedAccounts: [],
        assignedTraining: [],
      };

      employees.push(newEmployee);
      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      ctx.logger.info('Successfully created employee profile', {
        id,
        name: input.name,
      });

      // ✅ SUCCESS AUDIT LOG
      await logAudit({
        employee: email,
        action: 'CREATE_EMPLOYEE',
        system: 'HRIS / Internal DB',
        status: 'SUCCESS',
        details: `Created employee ${input.name} (${id}) with role ${input.role}`
      });

      return {
        success: true,
        message: `Successfully created employee profile for ${input.name}`,
        data: newEmployee,
      };
    } catch (error) {
      ctx.logger.error('Failed to create employee', {
        error: (error as Error).message,
      });

      // ❌ FAILURE AUDIT LOG
      await logAudit({
        employee: email,
        action: 'CREATE_EMPLOYEE',
        system: 'HRIS / Internal DB',
        status: 'FAILED',
        details: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to create employee profile: ${(error as Error).message}`,
        data: null,
      };
    }
  }
}