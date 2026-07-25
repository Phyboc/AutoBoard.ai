import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db';

export class AssignTrainingTool {
	async execute(input: { email: string; modules: string[] }, ctx: ExecutionContext) {
		ctx.logger.info('Assigning training modules', { email: input.email, modules: input.modules });

		const employees = (await readDB('employees.json')) || [];
		const employee = employees.find((e: any) => e.email === input.email);

		if (!employee) {
			ctx.logger.warn(`Employee with email '${input.email}' not found for training assignment`);
			return {
				success: false,
				message: `Employee with email ${input.email} was not found.`,
				data: null
			};
		}

		ctx.logger.info(`Successfully assigned ${input.modules.length} training module(s) to ${input.email}`);

		return {
			success: true,
			message: `Successfully assigned training modules to ${input.email}`,
			data: {
				email: input.email,
				modules: input.modules,
				status: 'Assigned'
			}
		};
	}
}