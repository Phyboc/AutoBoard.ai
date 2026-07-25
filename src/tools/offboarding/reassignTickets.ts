import { ToolDecorator as Tool, z, ExecutionContext } from '@nitrostack/core';

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
    description: 'Reassigns open task/project tickets from an offboarding employee to a active team member.',
    inputSchema: z.object({
      oldEmail: z.string().email('Invalid source email address format (must contain @)'),
      newEmail: z.string().email('Invalid target email address format (must contain @)'),
    }),
  })
  async execute(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
    // ==========================================
    // 1. BASIC VALIDATION GUARDS
    // ==========================================
    if (!input.oldEmail || !input.oldEmail.includes('@')) {
      throw new Error('Validation Error: Source email (oldEmail) is invalid or missing "@".');
    }

    if (!input.newEmail || !input.newEmail.includes('@')) {
      throw new Error('Validation Error: Target email (newEmail) is invalid or missing "@".');
    }

    const cleanOldEmail = input.oldEmail.trim().toLowerCase();
    const cleanNewEmail = input.newEmail.trim().toLowerCase();

    if (cleanOldEmail === cleanNewEmail) {
      throw new Error('Validation Error: Source and target emails cannot be identical.');
    }

    ctx.logger.info('Reassigning tickets', { from: cleanOldEmail, to: cleanNewEmail });

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
  }
}