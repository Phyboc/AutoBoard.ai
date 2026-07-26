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
    name: 'onboardEmployee',
    description: 'Complete end-to-end employee onboarding workflow (creates profile, provisions accounts, assigns training, and sends welcome email)',
    inputSchema: z.object({
      name: z.string().describe('Full name of the employee'),
      email: z.string().email().describe('Company email address'),
      role: z.string().describe('Job role/title'),
      startDate: z.string().describe('Start date (e.g. "Monday" or "2025-01-15")')
    })
  })
  @Widget('/onboarding')
  async onboardEmployee(input: { name: string; email: string; role: string; startDate: string }, ctx: ExecutionContext) {
    const reqs = await new FetchRoleRequirementsTool().execute({ role: input.role }, ctx);
    const emp = await new CreateEmployeeTool().execute(input, ctx);

    const reqData = reqs.data || { software: [], training: [], channels: [] };
    const platforms: string[] = reqData.software || [];
    for (const platform of platforms) {
      await new ProvisionAccountTool().execute({ platform, email: input.email }, ctx);
    }

    const trainingModules: string[] = reqData.training || [];
    if (trainingModules.length > 0) {
      await new AssignTrainingTool().execute({ email: input.email, modules: trainingModules }, ctx);
    }

    await new SendWelcomeEmailTool().execute({ email: input.email }, ctx);

    return {
      success: true,
      message: `Successfully onboarded ${input.name} (${input.email})`,
      data: {
        employeeName: input.name,
        email: input.email,
        role: input.role,
        employeeId: emp.data?.id,
        progress: [
          { label: 'Fetch Role Requirements', done: true },
          { label: 'Create Employee Profile', done: true },
          { label: `Provision Accounts (${platforms.join(', ')})`, done: true },
          { label: `Assign Training (${trainingModules.length} modules)`, done: trainingModules.length > 0 },
          { label: 'Send Welcome Email', done: true }
        ],
        status: 'Completed'
      }
    };
  }
}
