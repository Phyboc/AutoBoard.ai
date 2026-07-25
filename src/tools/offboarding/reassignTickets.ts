import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';
import { logAudit } from '../../utils/auditLogger.js';

// 1. Hackathon Mock Database
const mockTicketDatabase = [
  { id: 'TKT-101', title: 'Update Navbar CSS', assignee: 'sarah@company.com', status: 'In Progress' },
  { id: 'TKT-102', title: 'Fix Login Bug', assignee: 'sarah@company.com', status: 'Open' },
  { id: 'TKT-103', title: 'Deploy to Staging', assignee: 'alex@company.com', status: 'Open' },
  { id: 'TKT-104', title: 'Write API Docs', assignee: 'sarah@company.com', status: 'In Review' },
];

export class ReassignTicketsTool {
  @Tool({
    name: 'reassignTickets',
    description: 'Reassigns open task/project tickets from an offboarding employee to an active team member.',
    inputSchema: z.object({
      oldEmail: z.string().email('Invalid source email address format (must contain @)'),
      newEmail: z.string().email('Invalid target email address format (must contain @)'),
    }),
  })
  async execute(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
    const cleanOldEmail = (input.oldEmail || '').trim().toLowerCase();
    const cleanNewEmail = (input.newEmail || '').trim().toLowerCase();

    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    if (!cleanOldEmail || !cleanOldEmail.includes('@')) {
      const err = 'Validation Error: Source email (oldEmail) is invalid or missing "@".';
      
      await logAudit({
        employee: cleanOldEmail || 'UNKNOWN',
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'FAILED',
        details: err,
      });

      throw new Error(err);
    }

    if (!cleanNewEmail || !cleanNewEmail.includes('@')) {
      const err = 'Validation Error: Target email (newEmail) is invalid or missing "@".';

      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'FAILED',
        details: err,
      });

      throw new Error(err);
    }

    if (cleanOldEmail === cleanNewEmail) {
      const err = 'Validation Error: Source and target emails cannot be identical.';

      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'FAILED',
        details: err,
      });

      throw new Error(err);
    }

    ctx.logger.info('Reassigning tickets', { from: cleanOldEmail, to: cleanNewEmail });

    try {
      // ==========================================
      // 2. REASSIGNMENT EXECUTION
      // ==========================================
      const reassignedTicketIds: string[] = [];
      let reassignedCount = 0;

      mockTicketDatabase.forEach((ticket) => {
        if (ticket.assignee.toLowerCase() === cleanOldEmail) {
          ticket.assignee = cleanNewEmail;
          reassignedTicketIds.push(ticket.id);
          reassignedCount++;
        }
      });

      const message =
        reassignedCount > 0
          ? `Successfully reassigned ${reassignedCount} tickets from ${cleanOldEmail} to ${cleanNewEmail}.`
          : `No active tickets found for ${cleanOldEmail}. Nothing to reassign.`;

      ctx.logger.info(message);

      // ✅ SUCCESS AUDIT LOG
      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'SUCCESS',
        details: `Reassigned ${reassignedCount} ticket(s) [${reassignedTicketIds.join(', ')}] to ${cleanNewEmail}`,
      });

      return {
        success: true,
        message,
        data: {
          from: cleanOldEmail,
          to: cleanNewEmail,
          totalReassigned: reassignedCount,
          ticketIds: reassignedTicketIds,
          currentTicketState: mockTicketDatabase,
        },
      };
    } catch (error) {
      ctx.logger.error('Failed to reassign tickets', { error: (error as Error).message });

      // ❌ FAILURE AUDIT LOG (Exception)
      await logAudit({
        employee: cleanOldEmail,
        action: 'REASSIGN_TICKETS',
        system: 'Ticketing System',
        status: 'FAILED',
        details: (error as Error).message,
      });

      throw error;
    }
  }
}