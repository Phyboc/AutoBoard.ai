import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class ProvisionAccountTool {
	async execute(input: { platform: string; email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Provisioning account', { platform: input.platform, email: input.email });

		// 1. Read existing employees from employees.json
		const employees = (await readDB('employees.json')) || [];

		// 2. Find the target employee by email
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`Employee with email '${input.email}' not found for provisioning`);
			return {
				success: false,
				message: `Employee with email ${input.email} was not found.`,
				data: null
			};
		}

		// 3. Ensure accounts array exists
		if (!employee.accounts) {
			employee.accounts = [];
		}

		// 4. Add platform if it isn't already provisioned
		if (!employee.accounts.includes(input.platform)) {
			employee.accounts.push(input.platform);
		}

		// 5. Persist updated employee record back to database
		const saved = await writeDB('employees.json', employees);

		if (!saved) {
			ctx.logger.error(`Failed to persist provisioned account '${input.platform}' for ${input.email}`);
			return {
				success: false,
				message: `Database error: Failed to provision ${input.platform} account.`,
				data: null
			};
		}

		ctx.logger.info(`Successfully provisioned ${input.platform} for ${input.email}`);

		return {
			success: true,
			message: `Successfully provisioned ${input.platform} account for ${input.email}`,
			data: {
				platform: input.platform,
				email: input.email,
				status: 'Provisioned',
				activeAccounts: employee.accounts
			}
		};
	}
}