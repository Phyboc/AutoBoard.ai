import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  startDate: string;
  status: 'Onboarding' | 'Active' | 'Offboarded';
  provisionedAccounts: string[];
  assignedTraining: string[];
  welcomeEmailSent?: boolean;
}

export class CreateEmployeeTool {
  async execute(
    input: { name: string; email?: string; role: string; startDate: string },
    ctx: ExecutionContext
  ) {
    const tracker = new ExecutionTracker('CREATE_EMPLOYEE');
    const email = input.email?.trim() || `${input.name.toLowerCase().replace(/\s+/g, '.')}@company.com`;

    ctx.logger.info('Creating employee profile', { name: input.name, role: input.role });

    try {
      if (!input.name || !input.name.trim()) {
        throw new Error('Validation Error: Employee name cannot be empty.');
      }
      if (!input.role || !input.role.trim()) {
        throw new Error('Validation Error: Employee role cannot be empty.');
      }

      const employees: Employee[] = (await readDB('employees.json')) || [];

      const id = `emp-${Date.now().toString().slice(-4)}`;

      const newEmployee: Employee = {
        id,
        name: input.name.trim(),
        email,
        role: input.role.trim(),
        startDate: input.startDate,
        status: 'Onboarding',
        provisionedAccounts: [],
        assignedTraining: []
      };

      employees.push(newEmployee);
      await writeDB('employees.json', employees);

      ctx.logger.info('Successfully created employee profile', { id, name: input.name });

      await tracker.addStep('Create Employee Record', 'SUCCESS');
      await tracker.finishWorkflow();

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
        widget: {
          name: 'OnboardingWidget',
          props: {
            success: true,
            message: `Successfully created employee profile for ${input.name}`,
            data: newEmployee
          }
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to create employee', { error: errMsg });

      await tracker.addStep('Create Employee Record', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: email || 'UNKNOWN',
        action: 'CREATE_EMPLOYEE',
        system: 'HRIS / Internal DB',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to create employee profile: ${errMsg}`,
        data: null,
        widget: {
          name: 'OnboardingWidget',
          props: {
            success: false,
            message: `Failed to create employee profile: ${errMsg}`,
            data: null
          }
        }
      };
    }
  }
}