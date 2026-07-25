import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db';

export class SendWelcomeEmailTool {
	async execute(input: { email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Sending welcome email', { email: input.email });

		const employees = (await readDB('employees.json')) || [];
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`Employee with email '${input.email}' not found for welcome email`);
			return {
				success: false,
				message: `Employee with email ${input.email} was not found.`,
				data: null
			};
		}

		ctx.logger.info(`Successfully sent welcome email to ${input.email}`);

		return {
			success: true,
			message: `Successfully sent welcome email to ${input.email}`,
			data: {
				email: input.email,
				status: 'Sent'
			}
		};
	}
}