import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import { readDB } from '../../utils/db.js';

export class EmployeeLifecycleResources {

	@Resource({
		uri: 'employee-lifecycle://employees',
		name: 'Employee Records',
		description: 'List of all employees in the system',
		mimeType: 'application/json'
	})
	async getEmployees(uri: string, ctx: ExecutionContext) {
		ctx.logger.info('Fetching employee records');

		const employees = (await readDB('employees.json')) || [];

		return {
			contents: [{
				uri,
				mimeType: 'application/json',
				text: JSON.stringify(employees, null, 2)
			}]
		};
	}

	@Resource({
		uri: 'employee-lifecycle://roles',
		name: 'Role Definitions',
		description: 'Role requirements including software, training, and channels',
		mimeType: 'application/json'
	})
	async getRoles(uri: string, ctx: ExecutionContext) {
		ctx.logger.info('Fetching role definitions');

		const roles = (await readDB('roles.json')) || [];

		return {
			contents: [{
				uri,
				mimeType: 'application/json',
				text: JSON.stringify(roles, null, 2)
			}]
		};
	}

	@Resource({
		uri: 'employee-lifecycle://tickets',
		name: 'Ticket Assignments',
		description: 'Tickets assigned to each employee by email',
		mimeType: 'application/json'
	})
	async getTickets(uri: string, ctx: ExecutionContext) {
		ctx.logger.info('Fetching ticket assignments');

		const tickets = (await readDB('tickets.json')) || [];

		return {
			contents: [{
				uri,
				mimeType: 'application/json',
				text: JSON.stringify(tickets, null, 2)
			}]
		};
	}
}