import { ExecutionContext } from '@nitrostack/core';
import { readFile } from 'node:fs/promises';
import { getResourcePath } from './utils';

export class GetUserAccessTool {
	async execute(input: { email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Fetching user access', { email: input.email });

		// 1. Read and parse employees.json directly
		let employees = [];
		try {
			const filePath = getResourcePath('employees.json');
			const data = await readFile(filePath, 'utf-8');
			employees = JSON.parse(data);
		} catch (error) {
			ctx.logger.error('Failed to read employees.json file', {
				error: error instanceof Error ? error.message : String(error)
			});
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