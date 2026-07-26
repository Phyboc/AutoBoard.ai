import { ExecutionContext } from '@nitrostack/core';
import { FetchRoleRequirementsTool } from '../modules/onboarding/tools/fetchRoleRequirements.js';
import { CreateEmployeeTool } from '../modules/onboarding/tools/createEmployee.js';
import { ProvisionAccountTool } from '../modules/onboarding/tools/provisionAccount.js';
import { AssignTrainingTool } from '../modules/onboarding/tools/assignTraining.js';
import { SendWelcomeEmailTool } from '../modules/onboarding/tools/sendWelcomeEmail.js';
import { ExecutionTracker } from '../utils/executionTracker.js';

export interface OnboardingWorkflowInput {
  name: string;
  email?: string;
  role: string;
  startDate: string;
  softwareList?: string[];
  trainingModules?: string[];
}

export async function runOnboardingWorkflow(
  input: OnboardingWorkflowInput,
  ctx: ExecutionContext
) {
  const tracker = new ExecutionTracker('FULL_ONBOARDING_WORKFLOW');
  ctx.logger.info('Starting Full End-to-End Onboarding Workflow', { name: input.name, role: input.role });

  const results: Record<string, any> = {};

  try {
    // -------------------------------------------------------------
    // Step 1: Fetch Role Requirements
    // -------------------------------------------------------------
    ctx.logger.info('Step 1: Fetching role requirements...');
    const roleReqTool = new FetchRoleRequirementsTool();
    const roleReqResult = await roleReqTool.execute({ role: input.role }, ctx);
    results.roleRequirements = roleReqResult;

    const roleSoftware = roleReqResult.data?.software || [];
    const roleTraining = roleReqResult.data?.training || [];

    const softwareToProvision = Array.from(
      new Set([...roleSoftware, ...(input.softwareList || [])])
    );
    const trainingToAssign = Array.from(
      new Set([...roleTraining, ...(input.trainingModules || [])])
    );

    await tracker.addStep(
      'Fetch Role Requirements',
      roleReqResult.success ? 'SUCCESS' : 'FAILED',
      roleReqResult.success ? undefined : roleReqResult.message
    );

    // -------------------------------------------------------------
    // Step 2: Create Employee Profile
    // -------------------------------------------------------------
    ctx.logger.info('Step 2: Creating employee profile...');
    const createEmpTool = new CreateEmployeeTool();
    const createResult = await createEmpTool.execute(
      {
        name: input.name,
        email: input.email,
        role: input.role,
        startDate: input.startDate
      },
      ctx
    );
    results.createEmployee = createResult;

    if (!createResult.success || !createResult.data) {
      await tracker.addStep('Create Employee Profile', 'FAILED', createResult.message);
      await tracker.finishWorkflow();

      return {
        success: false,
        message: `Workflow aborted at Step 2 (Create Employee): ${createResult.message}`,
        workflowSummary: tracker.getSummary(),
        stepResults: results
      };
    }

    const employeeEmail = createResult.data.email;
    await tracker.addStep('Create Employee Profile', 'SUCCESS');

    // -------------------------------------------------------------
    // Step 3: Provision Accounts
    // -------------------------------------------------------------
    ctx.logger.info('Step 3: Provisioning accounts...', { software: softwareToProvision });
    if (softwareToProvision.length > 0) {
      const provisionTool = new ProvisionAccountTool();
      const provisionResult = await provisionTool.execute(
        {
          email: employeeEmail,
          softwareList: softwareToProvision
        },
        ctx
      );
      results.provisionAccounts = provisionResult;

      await tracker.addStep(
        'Provision Accounts',
        provisionResult.success ? 'SUCCESS' : 'FAILED',
        provisionResult.success ? undefined : provisionResult.message
      );
    } else {
      ctx.logger.info('Step 3: No software platforms to provision');
      await tracker.addStep('Provision Accounts', 'SUCCESS');
    }

    // -------------------------------------------------------------
    // Step 4: Assign Training Modules
    // -------------------------------------------------------------
    ctx.logger.info('Step 4: Assigning training modules...', { modules: trainingToAssign });
    if (trainingToAssign.length > 0) {
      const assignTrainingTool = new AssignTrainingTool();
      const trainingResult = await assignTrainingTool.execute(
        {
          email: employeeEmail,
          modules: trainingToAssign
        },
        ctx
      );
      results.assignTraining = trainingResult;

      await tracker.addStep(
        'Assign Training Modules',
        trainingResult.success ? 'SUCCESS' : 'FAILED',
        trainingResult.success ? undefined : trainingResult.message
      );
    } else {
      ctx.logger.info('Step 4: No training modules to assign');
      await tracker.addStep('Assign Training Modules', 'SUCCESS');
    }

    // -------------------------------------------------------------
    // Step 5: Send Welcome Email
    // -------------------------------------------------------------
    ctx.logger.info('Step 5: Sending welcome email...');
    const welcomeEmailTool = new SendWelcomeEmailTool();
    const emailResult = await welcomeEmailTool.execute({ email: employeeEmail }, ctx);
    results.sendWelcomeEmail = emailResult;

    await tracker.addStep(
      'Send Welcome Email',
      emailResult.success ? 'SUCCESS' : 'FAILED',
      emailResult.success ? undefined : emailResult.message
    );

    const summary = await tracker.finishWorkflow();
    ctx.logger.info('Full Onboarding Workflow Completed', { employeeEmail, summary });

    return {
      success: true,
      message: `Full onboarding workflow successfully executed for ${input.name} (${employeeEmail})`,
      data: {
        employee: results.createEmployee.data,
        provisionedAccounts: results.provisionAccounts?.data?.provisioned || [],
        assignedTraining: results.assignTraining?.data?.assigned || [],
        welcomeEmailPreview: results.sendWelcomeEmail?.data?.previewUrl || ''
      },
      workflowSummary: summary,
      stepResults: results
    };
  } catch (error) {
    const errMsg = (error as Error).message;
    ctx.logger.error('Critical Error in Full Onboarding Workflow', { error: errMsg });

    await tracker.addStep('Workflow Execution', 'FAILED', errMsg);
    const summary = await tracker.finishWorkflow();

    return {
      success: false,
      message: `Full onboarding workflow failed: ${errMsg}`,
      workflowSummary: summary,
      stepResults: results
    };
  }
}
