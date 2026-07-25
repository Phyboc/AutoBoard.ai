import { ExecutionContext } from '@nitrostack/core';
import { readFile, writeFile } from 'node:fs/promises';
import { getResourcePath } from '../utils.js';
import { Employee } from './createEmployee.js';
import { logAudit } from '../../utils/auditLogger.js'; // Added Audit Logger

interface AssignTrainingInput {
  email?: string;
  employeeId?: string;
  modules: string[];
}

export class AssignTrainingTool {
  async execute(input: AssignTrainingInput, ctx: ExecutionContext) {
    ctx.logger.info('Assigning training modules', { 
      email: input.email ?? '', 
      moduleCount: input.modules?.length ?? 0 
    });

    const identifier = (input.email || input.employeeId || '').toLowerCase();

    if (!identifier) {
      return {
        success: false,
        message: 'Either email or employeeId must be provided.',
        data: { assigned: [] }
      };
    }

    try {
      const filePath = getResourcePath('employees.json');
      const fileData = await readFile(filePath, 'utf-8');
      const employees: Employee[] = JSON.parse(fileData);

      const emp = employees.find(
        (e) =>
          e.email.toLowerCase() === identifier ||
          e.id.toLowerCase() === identifier ||
          e.name.toLowerCase().includes(identifier)
      );

      if (!emp) {
        const notFoundMsg = `Employee matching '${identifier}' was not found.`;

        // ❌ FAILURE AUDIT LOG (Employee Not Found)
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

      // Add modules to assignedTraining without duplicates
      emp.assignedTraining = Array.from(
        new Set([...(emp.assignedTraining || []), ...modulesToAssign])
      );

      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      ctx.logger.info('Training modules successfully assigned', { employeeId: emp.id });

      // ✅ SUCCESS AUDIT LOG
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
      ctx.logger.error('Failed to assign training', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG (Exception)
      await logAudit({
        employee: identifier,
        action: 'ASSIGN_TRAINING',
        system: 'LMS / Training System',
        status: 'FAILED',
        details: (error as Error).message
      });

      return {
        success: false,
        message: `Failed to assign training: ${(error as Error).message}`,
        data: { assigned: [] }
      };
    }
  }
}