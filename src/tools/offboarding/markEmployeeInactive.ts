import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../utils/db.js';
import { logAudit } from '../../utils/auditLogger.js';

interface MarkInactiveInput {
  email: string;
}

export class MarkEmployeeInactiveTool {
  async execute(input: MarkInactiveInput, ctx: ExecutionContext) {
    ctx.logger.info('Marking employee inactive', { email: input.email });

    const targetIdentifier = (input.email || '').toLowerCase().trim();

    if (!targetIdentifier) {
      return {
        success: false,
        message: 'Email or employee identifier must be provided.',
        data: null
      };
    }

    try {
      const employees = await readDB('employees.json');

      if (!employees) {
        ctx.logger.error('Failed to read employees.json');

        await logAudit({
          employee: targetIdentifier,
          action: 'MARK_EMPLOYEE_INACTIVE',
          system: 'HRIS / Internal DB',
          status: 'FAILED',
          details: 'Failed to access employee database.'
        });

        return {
          success: false,
          message: 'Failed to access database.',
          data: null
        };
      }

      // Find employee by email, ID, or partial name match
      const employee = employees.find(
        (e: any) =>
          e.email?.toLowerCase() === targetIdentifier ||
          e.id?.toLowerCase() === targetIdentifier ||
          e.name?.toLowerCase().includes(targetIdentifier)
      );

      if (!employee) {
        const notFoundMsg = `Employee '${input.email}' not found in database.`;
        ctx.logger.warn(`Employee ${input.email} not found to mark inactive`);

        // ❌ FAILURE AUDIT LOG (User Not Found)
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

      // Update status to Offboarded / Inactive
      employee.status = 'Offboarded';

      const saved = await writeDB('employees.json', employees);

      if (!saved) {
        const writeErrMsg = 'Database write error while updating status.';
        ctx.logger.error('Failed to save updated employee status');

        // ❌ FAILURE AUDIT LOG (Write Error)
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

      // ✅ SUCCESS AUDIT LOG
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
      ctx.logger.error('Failed to mark employee inactive', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG (Exception)
      await logAudit({
        employee: targetIdentifier,
        action: 'MARK_EMPLOYEE_INACTIVE',
        system: 'HRIS / Internal DB',
        status: 'FAILED',
        details: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to mark employee inactive: ${(error as Error).message}`,
        data: null
      };
    }
  }
}