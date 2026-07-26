import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import { FetchRoleRequirementsTool } from '../../tools/onboarding/fetchRoleRequirements.js';
import { CreateEmployeeTool } from '../../tools/onboarding/createEmployee.js';
import { ProvisionAccountTool } from '../../tools/onboarding/provisionAccount.js';
import { AssignTrainingTool } from '../../tools/onboarding/assignTraining.js';
import { SendWelcomeEmailTool } from '../../tools/onboarding/sendWelcomeEmail.js';
import { GetUserAccessTool } from '../../tools/offboarding/getUserAccess.js';
import { RevokeAccountTool } from '../../tools/offboarding/revokeAccount.js';
import { ReassignTicketsTool } from '../../tools/offboarding/reassignTickets.js';
import { MarkEmployeeInactiveTool } from '../../tools/offboarding/markEmployeeInactive.js';
import { AssignTaskTool } from '../../tools/onboarding/assignTask.js';
/**
 * Composite tool class that aggregates all employee lifecycle tools.
 * Each method delegates to the corresponding standalone tool class.
 */
export class EmployeeLifecycleTools {

	@Tool({
		name: 'fetchRoleRequirements',
		description: 'Fetch the software, training, and channel requirements for a given role',
		inputSchema: z.object({
			role: z.string().describe('The job role title to look up (e.g. "Junior Frontend Developer")')
		})
	})
	async fetchRoleRequirements(input: { role: string }, ctx: ExecutionContext) {
		return new FetchRoleRequirementsTool().execute(input, ctx);
	}

	@Tool({
		name: 'createEmployee',
		description: 'Create a new employee profile in the system',
		inputSchema: z.object({
			name: z.string().describe('Full name of the employee'),
			email: z.string().email().describe('Company email address'),
			role: z.string().describe('Job role/title'),
			startDate: z.string().describe('Start date (e.g. "Monday" or "2025-01-15")')
		})
	})
	async createEmployee(input: { name: string; email: string; role: string; startDate: string }, ctx: ExecutionContext) {
		return new CreateEmployeeTool().execute(input, ctx);
	}

	@Tool({
		name: 'provisionAccount',
		description: 'Provision a user account on a given platform (e.g. Google Workspace, Slack, GitHub, Jira)',
		inputSchema: z.object({
			platform: z.string().describe('The platform to provision the account on'),
			email: z.string().email().describe('The company email of the employee')
		})
	})
	async provisionAccount(input: { platform: string; email: string }, ctx: ExecutionContext) {
		return new ProvisionAccountTool().execute(input, ctx);
	}

	@Tool({
		name: 'assignTraining',
		description: 'Assign training modules to an employee',
		inputSchema: z.object({
			email: z.string().email().describe('The company email of the employee'),
			modules: z.array(z.string()).describe('List of training module names to assign')
		})
	})
	async assignTraining(input: { email: string; modules: string[] }, ctx: ExecutionContext) {
		return new AssignTrainingTool().execute(input, ctx);
	}

	@Tool({
		name: 'sendWelcomeEmail',
		description: 'Send a welcome email to a newly onboarded employee',
		inputSchema: z.object({
			email: z.string().email().describe('The company email of the employee')
		})
	})
	async sendWelcomeEmail(input: { email: string }, ctx: ExecutionContext) {
		return new SendWelcomeEmailTool().execute(input, ctx);
	}

	@Tool({
		name: 'getUserAccess',
		description: 'Get the list of platforms and systems a user has access to',
		inputSchema: z.object({
			email: z.string().email().describe('The company email of the employee')
		})
	})
	async getUserAccess(input: { email: string }, ctx: ExecutionContext) {
		return new GetUserAccessTool().execute(input, ctx);
	}

	@Tool({
		name: 'revokeAccount',
		description: 'Revoke a user account on a given platform during offboarding',
		inputSchema: z.object({
			platform: z.string().describe('The platform to revoke access from'),
			email: z.string().email().describe('The company email of the employee')
		})
	})
	async revokeAccount(input: { platform: string; email: string }, ctx: ExecutionContext) {
		return new RevokeAccountTool().execute(input, ctx);
	}

	@Tool({
		name: 'reassignTickets',
		description: 'Reassign tickets from an offboarded employee to another employee',
		inputSchema: z.object({
			oldEmail: z.string().email().describe('The email of the employee leaving'),
			newEmail: z.string().email().describe('The email of the employee taking over')
		})
	})
	async reassignTickets(input: { oldEmail: string; newEmail: string }, ctx: ExecutionContext) {
		return new ReassignTicketsTool().execute(input, ctx);
	}

	@Tool({
		name: 'markEmployeeInactive',
		description: 'Mark an employee as inactive in the core HR system',
		inputSchema: z.object({
			email: z.string().email().describe('The company email of the employee')
		})
	})
	async markEmployeeInactive(input: { email: string }, ctx: ExecutionContext) {
		return new MarkEmployeeInactiveTool().execute(input, ctx);
	}

	@Tool({
		name: 'assignTask',
		description: 'Assign a new task or ticket to an employee',
		inputSchema: z.object({
			email: z.string().email().describe('The company email of the employee'),
			title: z.string().describe('The title of the task to assign')
		})
	})
	async assignTask(input: { email: string; title: string }, ctx: ExecutionContext) {
		return new AssignTaskTool().execute(input, ctx);
	}
}