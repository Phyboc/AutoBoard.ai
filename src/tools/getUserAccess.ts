import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db';

export class GetUserAccessTool {
	async execute(input: { email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Fetching user access', { email: input.email });

		const employees = (await readDB('employees.json')) || [];
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`User '${input.email}' not found in database`);
			return {
				success: false,
				message: `User with email ${input.email} was not found in database.`,
				data: {
					email: input.email,
					platforms: []
				}
			};
		}

		const platforms = employee.accounts || [];

		ctx.logger.info(`Retrieved ${platforms.length} active platform(s) for ${input.email}`);

		return {
			success: true,
			message: `Successfully fetched active access for ${input.email}`,
			data: {
				email: input.email,
				platforms
			}
		};
	}
}