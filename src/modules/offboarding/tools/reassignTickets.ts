import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../../../utils/db.js';
import { logAudit } from '../../../utils/auditLogger.js';
import { ExecutionTracker } from '../../../utils/executionTracker.js';
import { requireConfirmation } from '../../../utils/permissionCheck.js';

const mockTicketDatabase = [
  { id: "TKT-101", title: "Update Navbar CSS", assignee: "sarah@company.com", status: "In Progress" },
  { id: "TKT-102", title: "Fix Login Bug", assignee: "sarah@company.com", status: "Open" },
  { id: "TKT-103", title: "Deploy to Staging", assignee: "alex@company.com", status: "Open" },
  { id: "TKT-104", title: "Write API Docs", assignee: "sarah@company.com", status: "In Review" }
];

export class ReassignTicketsTool {
  async execute(input: { oldEmail: string; newEmail: string; confirm?: boolean }, ctx: ExecutionContext) {
    // Confirmation guard: ask once before reassigning tickets
    const confirmation = requireConfirmation(input, ctx, `reassign tickets from ${input.oldEmail} to ${input.newEmail}`);
    if (!confirmation.confirmed) {
      ctx.logger.info(`[reassignTickets] Confirmation required for ${input.oldEmail} — operating as ${confirmation.role}`);
      return {
        success: false,
        message: confirmation.message,
        data: null
      };
    }

    const tracker = new ExecutionTracker('REASSIGN_TICKETS');
    const cleanOldEmail = (input.oldEmail || '').trim().toLowerCase();
    const cleanNewEmail = (input.newEmail || '').trim().toLowerCase();

    ctx.logger.info('Reassigning tickets', { from: cleanOldEmail, to: cleanNewEmail });

    if (!cleanOldEmail || !cleanOldEmail.includes('@')) {
      const err = 'Validation Error: Source email (oldEmail) is invalid or missing "@".';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanOldEmail || 'UNKNOWN',
        action: 'REASSIGN_TICKETS',
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

    if (!cleanNewEmail || !cleanNewEmail.includes('@')) {
      const err = 'Validation Error: Target email (newEmail) is invalid or missing "@".';
      await tracker.addStep('Validation', 'FAILED', err);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
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
        ticketDatabase = mockTicketDatabase;
      }

      const reassignedTicketIds: string[] = [];
      let reassignedCount = 0;

      ticketDatabase.forEach((ticket: any) => {
        if (ticket.assignee?.toLowerCase() === cleanOldEmail) {
          ticket.assignee = cleanNewEmail;
          reassignedTicketIds.push(ticket.id);
          reassignedCount++;
        }
      });

      if (reassignedCount > 0) {
        await writeDB('tickets.json', ticketDatabase);
      }

      const message = reassignedCount > 0 
        ? `Successfully reassigned ${reassignedCount} tickets from ${cleanOldEmail} to ${cleanNewEmail}.`
        : `No active tickets found for ${cleanOldEmail}. Nothing to reassign.`;

      ctx.logger.info(message);

      await tracker.addStep('Reassign Tickets', 'SUCCESS');
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'SUCCESS',
        details: `Reassigned ${reassignedCount} ticket(s) [${reassignedTicketIds.join(', ')}] to ${cleanNewEmail}`,
      });

      return {
        success: true,
        message: message,
        data: {
          from: cleanOldEmail,
          to: cleanNewEmail,
          totalReassigned: reassignedCount,
          ticketIds: reassignedTicketIds,
          currentTicketState: ticketDatabase 
        }
      };
    } catch (error) {
      const errMsg = (error as Error).message;
      ctx.logger.error('Failed to reassign tickets', { error: errMsg });

      await tracker.addStep('Reassign Tickets', 'FAILED', errMsg);
      await tracker.finishWorkflow();

      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'FAILED',
        details: errMsg,
      });

      return {
        success: false,
        message: `Failed to reassign tickets: ${errMsg}`,
        data: null
      };
    }
  }
}
