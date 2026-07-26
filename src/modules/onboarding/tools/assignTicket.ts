import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';

const mockTicketDatabase = [
  { id: "TKT-101", title: "Update Navbar CSS", assignee: "sarah@company.com", status: "In Progress" },
  { id: "TKT-102", title: "Fix Login Bug", assignee: "sarah@company.com", status: "Open" },
  { id: "TKT-103", title: "Deploy to Staging", assignee: "alex@company.com", status: "Open" },
  { id: "TKT-104", title: "Write API Docs", assignee: "sarah@company.com", status: "In Review" }
];

export class AssignTicketTool {
  async execute(input: { email: string; title: string; description?: string }, ctx: ExecutionContext) {
    const tracker = new ExecutionTracker('ASSIGN_TICKET');
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const title = (input.title || '').trim();

    ctx.logger.info('Assigning new ticket', { to: cleanEmail, title });

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const err = 'Validation Error: Email is invalid or missing "@".';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail || 'UNKNOWN',
        action: 'ASSIGN_TICKET',
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

    if (!title) {
      const err = 'Validation Error: Ticket title is required.';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TICKET',
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

    await tracker.addStep('Validation', 'SUCCESS');

    try {
      let ticketDatabase = await readDB('tickets.json');
      if (Array.isArray(ticketDatabase) && ticketDatabase.length === 0) {
        ticketDatabase = [...mockTicketDatabase];
      }

      const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket = {
        id: newId,
        title: title,
        description: input.description || '',
        assignee: cleanEmail,
        status: "Open"
      };

      ticketDatabase.push(newTicket);
      await tracker.addStep('Create Ticket', 'SUCCESS');

      try {
        await writeDB('tickets.json', ticketDatabase);
        await tracker.addStep('Save Database', 'SUCCESS');
      } catch (dbErr: any) {
        ctx.logger.error('Failed to save tickets database', { error: dbErr });
        await tracker.addStep('Save Database', 'FAILED', dbErr.message);
      }

      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TICKET',
        system: 'Ticketing System',
        status: 'SUCCESS',
        details: `Assigned ticket ${newId}: ${title}`,
      });

      return {
        success: true,
        message: `Successfully created and assigned ticket ${newId} to ${cleanEmail}.`,
        data: { ticket: newTicket }
      };
    } catch (error: any) {
      ctx.logger.error('Error assigning ticket', { error });
      await tracker.addStep('System Error', 'FAILED', error.message);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanEmail,
        action: 'ASSIGN_TICKET',
        system: 'Ticketing System',
        status: 'FAILED',
        details: error.message || 'Unknown error',
      });

      return {
        success: false,
        message: `Internal error: ${error.message}`,
        data: null
      };
    }
  }
}
