import { ExecutionContext } from '@nitrostack/core';

// 1. Hackathon Mock Database
// We place this here so you have instant fake data to prove the logic works.
// In a real app, you would fetch this from Jira or Linear's API.
const mockTicketDatabase = [
  { id: "TKT-101", title: "Update Navbar CSS", assignee: "sarah@company.com", status: "In Progress" },
  { id: "TKT-102", title: "Fix Login Bug", assignee: "sarah@company.com", status: "Open" },
  { id: "TKT-103", title: "Deploy to Staging", assignee: "alex@company.com", status: "Open" },
  { id: "TKT-104", title: "Write API Docs", assignee: "sarah@company.com", status: "In Review" }
];

export class ReassignTicketsTool {
  async execute(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
    ctx.logger.info('Reassigning tickets', { from: input.oldEmail, to: input.newEmail });

    // 2. Track which tickets we are modifying for the UI/LLM response
    const reassignedTicketIds: string[] = [];
    let reassignedCount = 0;

    // 3. Execute the actual reassignment logic on the mock database
    mockTicketDatabase.forEach(ticket => {
      if (ticket.assignee === input.oldEmail) {
        ticket.assignee = input.newEmail; // The reassignment
        reassignedTicketIds.push(ticket.id);
        reassignedCount++;
      }
    });

    // 4. Formulate a clean message for the Agent's "Brain" to read
    const message = reassignedCount > 0 
      ? `Successfully reassigned ${reassignedCount} tickets from ${input.oldEmail} to ${input.newEmail}.`
      : `No active tickets found for ${input.oldEmail}. Nothing to reassign.`;

    ctx.logger.info(message);

    // 5. Return the payload. The 'data' object is what you will pass to your React Widget!
    return {
      success: true,
      message: message,
      data: {
        from: input.oldEmail,
        to: input.newEmail,
        totalReassigned: reassignedCount,
        ticketIds: reassignedTicketIds,
        // We return the whole updated database so your Widget can display the new state
        currentTicketState: mockTicketDatabase 
      }
    };
  }
}
