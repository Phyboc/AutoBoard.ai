import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

interface AssignTaskInput {
  email: string;
  title: string;
}

export class AssignTaskTool {
  async execute(input: AssignTaskInput, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('ASSIGN_TASK');
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const taskTitle = (input.title || '').trim();

    ctx.logger.info('Assigning new task', { assignee: cleanEmail, title: taskTitle });

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Validation Error: Assignee email is invalid or missing "@".';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail || 'UNKNOWN',
        action: 'ASSIGN_TASK',
        system: 'Ticketing System',
        status: 'FAILED',
        details: err,
      });

      return {
        success: false,
        message: err,
        data: null
      };
    }

    if (!taskTitle) {
      const err = 'Validation Error: Task title is required.';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TASK',
        system: 'Ticketing System',
        status: 'FAILED',
        details: err,
      });

      return {
        success: false,
        message: err,
        data: null
      };
    }

    try {
      let ticketDatabase = await readDB('tickets.json');
      if (!ticketDatabase || !Array.isArray(ticketDatabase) || ticketDatabase.length === 0) {
        ticketDatabase = [];
      }

      // Generate a new ID (e.g. TKT-105)
      const existingIds = ticketDatabase
        .map((t: any) => parseInt(t.id.replace('TKT-', '')))
        .filter((n: number) => !isNaN(n));
      
      const nextIdNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
      const newTicketId = `TKT-${nextIdNumber}`;

      const newTicket = {
        id: newTicketId,
        title: taskTitle,
        assignee: cleanEmail,
        status: 'Open'
      };

      ticketDatabase.push(newTicket);
      await writeDB('tickets.json', ticketDatabase);

      const message = `Successfully assigned task '${taskTitle}' (${newTicketId}) to ${cleanEmail}.`;
      ctx.logger.info(message);

      await tracker.addStep('Assign Task', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TASK',
        system: 'Ticketing System',
        status: 'SUCCESS',
        details: message,
      });

      return {
        success: true,
        message: message,
        data: {
          ticketId: newTicketId,
          title: taskTitle,
          assignee: cleanEmail
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to assign task', { error: errMsg });

      await tracker.addStep('Assign Task', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TASK',
        system: 'Ticketing System',
        status: 'FAILED',
        details: errMsg,
      });

      return {
        success: false,
        message: `Failed to assign task: ${errMsg}`,
        data: null
      };
    }
  }
}
