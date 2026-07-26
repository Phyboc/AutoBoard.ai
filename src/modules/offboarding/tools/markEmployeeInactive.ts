import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

interface MarkInactiveInput {
  email: string;
}

export class MarkEmployeeInactiveTool {
  async execute(input: MarkInactiveInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('MARK_EMPLOYEE_INACTIVE');
    ctx.logger.info('Marking employee inactive', { email: input.email });

    const targetIdentifier = (input.email || '').toLowerCase().trim();

    if (!targetIdentifier) {
      const errMsg = 'Email or employee identifier must be provided.';
      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'MARK_EMPLOYEE_INACTIVE',
        system: 'HRIS / Internal DB',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: null
      };
    }

    try {
      const employees = await readDB('employees.json');

      if (!employees || !Array.isArray(employees)) {
        const dbErrMsg = 'Failed to access employee database.';
        ctx.logger.error('Failed to read employees.json');

        await tracker.addStep('Read Database', 'FAILED', dbErrMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetIdentifier,
          action: 'MARK_EMPLOYEE_INACTIVE',
          system: 'HRIS / Internal DB',
          status: 'FAILED',
          details: dbErrMsg
        });

        return {
          success: false,
          message: dbErrMsg,
          data: null
        };
      }

      const employee = employees.find(
        (e: any) =>
          e.email?.toLowerCase() === targetIdentifier ||
          e.id?.toLowerCase() === targetIdentifier ||
          e.name?.toLowerCase().includes(targetIdentifier)
      );

      if (!employee) {
        const notFoundMsg = `Employee '${input.email}' not found in database.`;
        ctx.logger.warn(`Employee ${input.email} not found to mark inactive`);

        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: targetIdentifier,
          action: 'MARK_EMPLOYEE_INACTIVE',
          system: 'HRIS / Internal DB',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: null
        };
      }

      employee.status = 'Offboarded';

      const saved = await writeDB('employees.json', employees);

      if (!saved) {
        const writeErrMsg = 'Database write error while updating status.';
        ctx.logger.error('Failed to save updated employee status');

        await tracker.addStep('Update Status', 'FAILED', writeErrMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: employee.email,
          action: 'MARK_EMPLOYEE_INACTIVE',
          system: 'HRIS / Internal DB',
          status: 'FAILED',
          details: writeErrMsg
        });

        return {
          success: false,
          message: writeErrMsg,
          data: null
        };
      }

      ctx.logger.info(`Successfully set status for ${employee.email} to Offboarded`);

      await tracker.addStep('Mark Employee Inactive', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: employee.email,
        action: 'MARK_EMPLOYEE_INACTIVE',
        system: 'HRIS / Internal DB',
        status: 'SUCCESS',
        details: `Updated employee status for ${employee.name} (${employee.id}) to Offboarded`
      });

      return {
        success: true,
        message: `Employee ${employee.name} (${employee.email}) status successfully updated to Offboarded.`,
        data: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          status: employee.status
        }
      };

    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to mark employee inactive', { error: errMsg });

      await tracker.addStep('Mark Employee Inactive', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: targetIdentifier,
        action: 'MARK_EMPLOYEE_INACTIVE',
        system: 'HRIS / Internal DB',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to mark employee inactive: ${errMsg}`,
        data: null
      };
    }
  }
}
