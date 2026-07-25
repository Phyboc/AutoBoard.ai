import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { FetchRoleRequirementsTool } from './tools/fetchRoleRequirements.js';
import { CreateEmployeeTool } from './tools/createEmployee.js';
import { ProvisionAccountTool } from './tools/provisionAccount.js';
import { AssignTrainingTool } from './tools/assignTraining.js';
import { SendWelcomeEmailTool } from './tools/sendWelcomeEmail.js';

/**
 * Onboarding tool class that aggregates all employee onboarding tools.
 * Each method delegates to the corresponding standalone tool class.
 */
export class OnboardingTools {

	@Tool({
		name: 'fetchRoleRequirements',
		description: 'Fetch the software, training, and channel requirements for a given role',
		inputSchema: z.object({
			role: z.string().describe('The job role title to look up (e.g. "Junior Frontend Developer")')
		})
	})
	@Widget('employee-lifecycle')
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
	@Widget('employee-lifecycle')
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
	@Widget('employee-lifecycle')
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
	@Widget('employee-lifecycle')
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
	@Widget('employee-lifecycle')
	async sendWelcomeEmail(input: { email: string }, ctx: ExecutionContext) {
		return new SendWelcomeEmailTool().execute(input, ctx);
	}
}