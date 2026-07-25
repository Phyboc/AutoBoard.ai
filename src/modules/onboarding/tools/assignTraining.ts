import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';
import { Employee } from './createEmployee.js';

interface AssignTrainingInput {
  email?: string;
  employeeId?: string;
  modules: string[];
}

export class AssignTrainingTool {
  async execute(input: AssignTrainingInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('ASSIGN_TRAINING');
    const identifier = (input.email || input.employeeId || '').toLowerCase();

    ctx.logger.info('Assigning training modules', { 
      email: input.email ?? '', 
      moduleCount: input.modules?.length ?? 0 
    });

    if (!identifier) {
      const errMsg = 'Either email or employeeId must be provided.';
      await tracker.addStep('Validation', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: 'UNKNOWN',
        action: 'ASSIGN_TRAINING',
        system: 'LMS / Training System',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: errMsg,
        data: { assigned: [] }
      };
    }

    try {
      const employees: Employee[] = (await readDB('employees.json')) || [];

      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === identifier ||
          e.id.toLowerCase() === identifier ||
          e.name.toLowerCase().includes(identifier)
      );

      if (!emp) {
        const notFoundMsg = `Employee matching '${identifier}' was not found.`;
        await tracker.addStep('Find Employee', 'FAILED', notFoundMsg);
        await tracker.finishWorkflow();

        await logAudit({
          employee: identifier,
          action: 'ASSIGN_TRAINING',
          system: 'LMS / Training System',
          status: 'FAILED',
          details: notFoundMsg
        });

        return {
          success: false,
          message: notFoundMsg,
          data: { assigned: [] }
        };
      }

      const modulesToAssign = Array.isArray(input.modules) ? input.modules : [];

      emp.assignedTraining = Array.from(
        new Set([...(emp.assignedTraining || []), ...modulesToAssign])
      );

      await writeDB('employees.json', employees);

      ctx.logger.info('Training modules successfully assigned', { employeeId: emp.id });

      await tracker.addStep('Assign Training', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: emp.email,
        action: 'ASSIGN_TRAINING',
        system: 'LMS / Training System',
        status: 'SUCCESS',
        details: `Assigned modules: ${modulesToAssign.join(', ')}`
      });

      return {
        success: true,
        message: `Successfully assigned ${modulesToAssign.length} training module(s) to ${emp.name}`,
        data: {
          employeeId: emp.id,
          name: emp.name,
          email: emp.email,
          assigned: emp.assignedTraining
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to assign training', { error: errMsg });

      await tracker.addStep('Assign Training', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: identifier,
        action: 'ASSIGN_TRAINING',
        system: 'LMS / Training System',
        status: 'FAILED',
        details: errMsg
      });

      return {
        success: false,
        message: `Failed to assign training: ${errMsg}`,
        data: { assigned: [] }
      };
    }
  }
}
