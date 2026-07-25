import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class ReassignTicketsTool {
	async execute(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
		ctx.logger.info('Reassigning tickets', { from: input.oldEmail, to: input.newEmail });

		const tickets = (await readDB('tickets.json')) || {};
		const reassignedTickets = tickets[input.oldEmail] || [];

		if (reassignedTickets.length === 0) {
			ctx.logger.info(`No active tickets found for ${input.oldEmail} to reassign`);
			return {
				success: true,
				message: `No active tickets found for ${input.oldEmail} to reassign.`,
				data: {
					from: input.oldEmail,
					to: input.newEmail,
					reassignedTickets: []
				}
			};
		}

		// Ensure recipient ticket array exists
		if (!tickets[input.newEmail]) {
			tickets[input.newEmail] = [];
		}

		// Move tickets to the new email and delete old email key
		tickets[input.newEmail].push(...reassignedTickets);
		delete tickets[input.oldEmail];

		const saved = await writeDB('tickets.json', tickets);

		if (!saved) {
			ctx.logger.error(`Failed to persist ticket reassignment from ${input.oldEmail} to ${input.newEmail}`);
			return {
				success: false,
				message: `Database error: Failed to reassign tickets from ${input.oldEmail} to ${input.newEmail}.`,
				data: null
			};
		}

		ctx.logger.info(`Reassigned ${reassignedTickets.length} ticket(s) from ${input.oldEmail} to ${input.newEmail}`);

		return {
			success: true,
			message: `Successfully reassigned tickets from ${input.oldEmail} to ${input.newEmail}`,
			data: {
				from: input.oldEmail,
				to: input.newEmail,
				reassignedTickets
			}
		};
	}
}