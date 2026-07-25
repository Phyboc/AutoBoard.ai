import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class MarkEmployeeInactiveTool {
	async execute(input: { email: string }, ctx: ExecutionContext) {
		ctx.logger.info('Marking employee inactive', { email: input.email });

		const employees = await readDB('employees.json');

		if (!employees) {
			ctx.logger.error('Failed to read employees.json');
			return {
				success: false,
				message: 'Failed to access database.',
				data: null
			};
		}

		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`Employee ${input.email} not found to mark inactive`);
			return {
				success: false,
				message: `Employee ${input.email} not found in database.`,
				data: null
			};
		}

		employee.status = 'Inactive';

		const saved = await writeDB('employees.json', employees);

		if (!saved) {
			ctx.logger.error('Failed to save updated employee status');
			return {
				success: false,
				message: 'Database write error while updating status.',
				data: null
			};
		}

		ctx.logger.info(`Successfully set status for ${input.email} to Inactive`);

		return {
			success: true,
			message: `Employee ${input.email} status successfully updated to Inactive.`,
			data: {
				email: input.email,
				status: 'Inactive'
			}
		};
	}
}