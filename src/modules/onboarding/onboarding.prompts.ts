// import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

// export class OnboardingPrompts {

//   @Prompt({
//     name: 'onboard_employee',
//     description: 'Autonomous orchestration prompt to onboard a new employee',
//     arguments: [
//       {
//         name: 'employee_name',
//         description: 'The name of the employee being onboarded',
//         required: true
//       },
//       {
//         name: 'employee_email',
//         description: 'The email address of the employee',
//         required: true
//       },
//       {
//         name: 'employee_role',
//         description: 'The job role/title (e.g., "Junior Frontend Developer")',
//         required: true
//       },
//       {
//         name: 'start_date',
//         description: 'Start date for the employee',
//         required: true
//       }
//     ]
//   })
//   async getOnboardingWorkflow(args: { employee_name: string; employee_email: string; employee_role: string; start_date: string }, ctx: ExecutionContext) {
//     ctx.logger.info(`Generating onboarding orchestration prompt for ${args.employee_name}`);

//     return [
//       {
//         role: 'user' as const,
//         content: `Please onboard a new employee with the following details:
// - Name: ${args.employee_name}
// - Email: ${args.employee_email}
// - Role: ${args.employee_role}
// - Start Date: ${args.start_date}

// Instructions for you (the AI Assistant):
// 1. First, execute the tool \`fetchRoleRequirements\` with role "${args.employee_role}" to get the required platforms and training modules.
// 2. Next, execute the tool \`createEmployee\` with name "${args.employee_name}", email "${args.employee_email}", role "${args.employee_role}", and startDate "${args.start_date}".
// 3. For each platform returned in step 1, execute \`provisionAccount\` with platform name and email "${args.employee_email}".
// 4. Execute \`assignTraining\` with email "${args.employee_email}" and the array of training modules returned in step 1.
// 5. Execute \`sendWelcomeEmail\` with email "${args.employee_email}".

// Please run these tools back-to-back right now to update the database records.`
//       }
//     ];
//   }
// }


import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';
import { FetchRoleRequirementsTool } from '../../tools/onboarding/fetchRoleRequirements.js';
import { CreateEmployeeTool } from '../../tools/onboarding/createEmployee.js';
import { ProvisionAccountTool } from '../../tools/onboarding/provisionAccount.js';
import { AssignTrainingTool } from '../../tools/onboarding/assignTraining.js';
import { SendWelcomeEmailTool } from '../../tools/onboarding/sendWelcomeEmail.js';
import { logAudit } from '../../utils/auditLogger.js';

export class OnboardingPrompts {

  @Prompt({
    name: 'onboard_employee',
    description: 'Autonomous orchestration prompt to onboard a new employee',
    arguments: [
      { name: 'employee_name', description: 'The name of the employee being onboarded', required: true },
      { name: 'employee_email', description: 'The email address of the employee', required: true },
      { name: 'employee_role', description: 'The job role/title', required: true },
      { name: 'start_date', description: 'Start date for the employee', required: true }
    ]
  })
  async getOnboardingWorkflow(args: { employee_name: string; employee_email: string; employee_role: string; start_date: string }, ctx: ExecutionContext) {
    ctx.logger.info(`Executing autonomous onboarding for ${args.employee_name}`);

    try {
      // 1. Fetch Role Requirements
      const roleReqs: any = await new FetchRoleRequirementsTool().execute({ role: args.employee_role }, ctx);

      // 2. Create Employee Profile
      await new CreateEmployeeTool().execute({
        name: args.employee_name,
        email: args.employee_email,
        role: args.employee_role,
        startDate: args.start_date
      }, ctx);

      // 3. Provision accounts for required software platforms
      const platforms = roleReqs?.software || ['Google Workspace', 'Slack'];
      for (const platform of platforms) {
        await new ProvisionAccountTool().execute({ platform, email: args.employee_email }, ctx);
      }

      // 4. Assign training modules
      const training = roleReqs?.training || ['Security Basics'];
      await new AssignTrainingTool().execute({ email: args.employee_email, modules: training }, ctx);

      // 5. Send welcome email
      await new SendWelcomeEmailTool().execute({ email: args.employee_email }, ctx);

      return [
        {
          role: 'assistant' as const,
          content: `# ✅ Onboarding Completed Successfully!\n\n` +
            `- **Employee:** ${args.employee_name} (${args.employee_email})\n` +
            `- **Role:** ${args.employee_role}\n` +
            `- **Platforms Provisioned:** ${platforms.join(', ')}\n` +
            `- **Training Assigned:** ${training.join(', ')}\n\n` +
            `All databases (` + '`employees.json`, `audit.json`, `execution.json`' + `) have been successfully updated.`
        }
      ];

    } catch (error: any) {
      ctx.logger.error(`Onboarding execution failed: ${error.message}`);
      return [
        {
          role: 'assistant' as const,
          content: `❌ **Onboarding Failed:** ${error.message}`
        }
      ];
    }
  }
}