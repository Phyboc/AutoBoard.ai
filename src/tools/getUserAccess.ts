import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db';

export class GetUserAccessTool {
	async execute(input: { email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Fetching user access', { email: input.email });

		// 1. Read employees using the db utility
		const employees = await readDB('employees.json');

		if (!employees) {
			ctx.logger.error('Failed to read employees.json file');
			return {
				success: false,
				message: 'Failed to access database.',
				data: { email: input.email, name: '', platforms: [] }
			};
		}

		// 2. Find employee record
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`User ${input.email} not found in database`);
			return {
				success: false,
				message: `User ${input.email} not found.`,
				data: { email: input.email, name: '', platforms: [] }
			};
		}

		const platforms = employee.accounts || [];
		ctx.logger.info(`Found ${platforms.length} active platform(s) for ${input.email}`);

		return {
			success: true,
			message: `Retrieved active platforms for ${input.email}`,
			data: {
				name: employee.name,
				email: employee.email,
				platforms
			}
		};
	}
}