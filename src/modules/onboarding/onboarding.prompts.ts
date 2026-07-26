import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';
import { FetchRoleRequirementsTool } from '../../tools/onboarding/fetchRoleRequirements.js';
import { CreateEmployeeTool } from '../../tools/onboarding/createEmployee.js';
import { ProvisionAccountTool } from '../../tools/onboarding/provisionAccount.js';
import { AssignTrainingTool } from '../../tools/onboarding/assignTraining.js';
import { SendWelcomeEmailTool } from '../../tools/onboarding/sendWelcomeEmail.js';
import * as fs from 'fs';
import * as path from 'path';

export class OnboardingPrompts {

  @Prompt({
    name: 'onboard_employee',
    description: 'Autonomous orchestration prompt to onboard a new employee with live progress tracking',
    arguments: [
      { name: 'employee_name', description: 'The name of the employee being onboarded', required: true },
      { name: 'employee_email', description: 'The email address of the employee', required: true },
      { name: 'employee_role', description: 'The job role/title', required: true },
      { name: 'start_date', description: 'Start date for the employee', required: true }
    ]
  })
  async getOnboardingWorkflow(args: { employee_name: string; employee_email: string; employee_role: string; start_date: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Starting live onboarding workflow for ${args.employee_name}`);

    const dbPath = path.resolve(process.cwd(), 'data/employees.json');

    // HELPER: Update local state file so the widget reacts instantly
    const updateState = (status: string, items: any[]) => {
      const statePayload = {
        actionType: 'GENERIC_PROGRESS',
        employeeName: args.employee_name,
        role: args.employee_role,
        email: args.employee_email,
        status: status,
        items: items
      };
      if (!fs.existsSync(path.dirname(dbPath))) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(statePayload, null, 2));
    };

    // STEP 1: Initial Render (Shows items as pending / NA)
    updateState('In Progress', [
      { label: 'Employee Profile Created', sublabel: 'Pending...', done: false },
      { label: 'Fetch Role Requirements', sublabel: 'Yet to be updated', done: false },
      { label: 'Provision Accounts', sublabel: 'NA', done: false },
      { label: 'Assign Training', sublabel: 'NA', done: false },
      { label: 'Send Welcome Email', sublabel: 'Pending', done: false }
    ]);

    try {
      // STEP 2: Create Employee
      await new CreateEmployeeTool().execute({
        name: args.employee_name,
        email: args.employee_email,
        role: args.employee_role,
        startDate: args.start_date
      }, ctx);

      updateState('In Progress', [
        { label: 'Employee Profile Created', sublabel: `ID: Generated`, done: true },
        { label: 'Fetch Role Requirements', sublabel: 'Running...', done: false },
        { label: 'Provision Accounts', sublabel: 'NA', done: false },
        { label: 'Assign Training', sublabel: 'NA', done: false },
        { label: 'Send Welcome Email', sublabel: 'Pending', done: false }
      ]);

      // STEP 3: Fetch Role Requirements
      const roleReqs: any = await new FetchRoleRequirementsTool().execute({ role: args.employee_role }, ctx);
      const platforms = roleReqs?.software || ['Google Workspace', 'Slack'];
      const training = roleReqs?.training || ['Security Basics'];

      updateState('In Progress', [
        { label: 'Employee Profile Created', sublabel: `Done`, done: true },
        { label: 'Fetch Role Requirements', sublabel: `${platforms.length} platforms found`, done: true },
        { label: 'Provision Accounts', sublabel: 'In Progress', done: false },
        { label: 'Assign Training', sublabel: 'Pending', done: false },
        { label: 'Send Welcome Email', sublabel: 'Pending', done: false }
      ]);

      // STEP 4: Provision Accounts
      for (const platform of platforms) {
        await new ProvisionAccountTool().execute({ platform, email: args.employee_email }, ctx);
      }

      updateState('In Progress', [
        { label: 'Employee Profile Created', sublabel: `Done`, done: true },
        { label: 'Fetch Role Requirements', sublabel: `Done`, done: true },
        { label: 'Provision Accounts', sublabel: `${platforms.join(', ')}`, done: true },
        { label: 'Assign Training', sublabel: 'Running...', done: false },
        { label: 'Send Welcome Email', sublabel: 'Pending', done: false }
      ]);

      // STEP 5: Assign Training
      await new AssignTrainingTool().execute({ email: args.employee_email, modules: training }, ctx);

      // STEP 6: Send Welcome Email
      await new SendWelcomeEmailTool().execute({ email: args.employee_email }, ctx);

      // FINAL STATE: Completed
      updateState('Completed', [
        { label: 'Employee Profile Created', sublabel: `Done`, done: true },
        { label: 'Fetch Role Requirements', sublabel: `Done`, done: true },
        { label: 'Provision Accounts', sublabel: `All Provisioned`, done: true },
        { label: 'Assign Training', sublabel: `Modules Assigned`, done: true },
        { label: 'Send Welcome Email', sublabel: `Sent`, done: true }
      ]);

      return [
        {
          role: 'assistant' as const,
          content: `✅ Onboarding successfully finished for **${args.employee_name}**!`
        }
      ];

    } catch (error: any) {
      updateState('Pending', [
        { label: 'Error Occurred', sublabel: error.message, done: false }
      ]);
      throw error;
    }
  }
}