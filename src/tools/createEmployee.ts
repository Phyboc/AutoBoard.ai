import { ExecutionContext } from '@nitrostack/core';
import { readDB, writeDB } from '../utils/db';

export class CreateEmployeeTool {
	async execute(input: { name: string; email: string; role: string; startDate: string }, ctx: ExecutionContext) {
		ctx.logger.info('Creating employee profile', { name: input.name, role: input.role });

		// 1. Read existing employees from employees.json
		const employees = (await readDB('employees.json')) || [];

		// 2. Check if an employee with this email already exists
		const existingEmployee = employees.find((e: any) => e.email === input.email);
		if (existingEmployee) {
			ctx.logger.warn(`Employee with email '${input.email}' already exists`);
			return {
				success: false,
				message: `Employee with email ${input.email} already exists.`,
				data: existingEmployee
			};
		}

		// 3. Construct the new employee profile
		const newEmployee = {
			name: input.name,
			email: input.email,
			role: input.role,
			startDate: input.startDate,
			status: 'Active',
			accounts: []
		};

		// 4. Append to array and persist back to database
		employees.push(newEmployee);
		const saved = await writeDB('employees.json', employees);

		if (!saved) {
			ctx.logger.error('Failed to write new employee to employees.json');
			return {
				success: false,
				message: 'Database error: Failed to save employee record.',
				data: null
			};
		}

		ctx.logger.info(`Successfully created employee record for ${input.name}`);

		return {
			success: true,
			message: `Successfully created employee profile for ${input.name} as ${input.role}`,
			data: newEmployee
		};
	}
}