import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class RevokeAccountTool {
	async execute(input: { platform: string; email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Revoking account', { platform: input.platform, email: input.email });

		const employees = (await readDB('employees.json')) || [];
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`Employee with email '${input.email}' not found for revocation`);
			return {
				success: false,
				message: `Employee with email ${input.email} was not found.`,
				data: null
			};
		}

		if (employee.accounts) {
			employee.accounts = employee.accounts.filter((acc: string) => acc !== input.platform);
		} else {
			employee.accounts = [];
		}

		// Mark as Inactive if all accounts have been revoked
		if (employee.accounts.length === 0) {
			employee.status = 'Inactive';
		}

		const saved = await writeDB('employees.json', employees);

		if (!saved) {
			ctx.logger.error(`Failed to persist revocation of '${input.platform}' for ${input.email}`);
			return {
				success: false,
				message: `Database error: Failed to revoke ${input.platform} account.`,
				data: null
			};
		}

		ctx.logger.info(`Successfully revoked ${input.platform} access for ${input.email}`);

		return {
			success: true,
			message: `Successfully revoked ${input.platform} account for ${input.email}`,
			data: {
				platform: input.platform,
				email: input.email,
				status: 'Revoked'
			}
		};
	}
}