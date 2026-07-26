import { ExecutionContext } from '@nitrostack/core';
import { GetUserAccessTool } from '../modules/offboarding/tools/getUserAccess.js';
import { RevokeAccountTool } from '../modules/offboarding/tools/revokeAccount.js';
import { ReassignTicketsTool } from '../modules/offboarding/tools/reassignTickets.js';
import { MarkEmployeeInactiveTool } from '../modules/offboarding/tools/markEmployeeInactive.js';
import { ExecutionTracker } from '../utils/executionTracker.js';

export interface OffboardingWorkflowInput {
  email: string;
  reassignToEmail: string;
}

export async function runOffboardingWorkflow(
  input: OffboardingWorkflowInput,
  ctx: ExecutionContext
) {
  const tracker = new ExecutionTracker('FULL_OFFBOARDING_WORKFLOW');
  ctx.logger.info('Starting Full End-to-End Offboarding Workflow', { email: input.email, reassignTo: input.reassignToEmail });

  const results: Record<string, any> = {};

  try {
    // -------------------------------------------------------------
    // Step 1: Fetch User Access & Active Platforms
    // -------------------------------------------------------------
    ctx.logger.info('Step 1: Fetching user platform access...');
    const getUserAccessTool = new GetUserAccessTool();
    const accessResult = await getUserAccessTool.execute({ email: input.email }, ctx);
    results.getUserAccess = accessResult;

    if (!accessResult.success || !accessResult.data) {
      await tracker.addStep('Fetch User Access', 'FAILED', accessResult.message);
      await tracker.finishWorkflow();

      return {
        success: false,
        message: `Workflow aborted at Step 1 (Get User Access): ${accessResult.message}`,
        workflowSummary: tracker.getSummary(),
        stepResults: results
      };
    }

    const employeeEmail = accessResult.data.email || input.email;
    const platforms: string[] = accessResult.data.platforms || [];

    await tracker.addStep('Fetch User Access', 'SUCCESS');

    // -------------------------------------------------------------
    // Step 2: Revoke Access Across All Active Platforms
    // -------------------------------------------------------------
    ctx.logger.info('Step 2: Revoking accounts across active platforms...', { platforms });
    const revokedPlatforms: string[] = [];
    const revokeTool = new RevokeAccountTool();

    for (const platform of platforms) {
      const revokeRes = await revokeTool.execute(
        {
          email: employeeEmail,
          platform,
          confirm: true
        },
        ctx
      );

      if (revokeRes.success) {
        revokedPlatforms.push(platform);
      }
    }

    results.revokeAccounts = {
      success: true,
      revokedPlatforms,
      totalRevoked: revokedPlatforms.length
    };

    await tracker.addStep('Revoke Accounts', 'SUCCESS');

    // -------------------------------------------------------------
    // Step 3: Reassign Tickets
    // -------------------------------------------------------------
    ctx.logger.info('Step 3: Reassigning open tickets...', { from: employeeEmail, to: input.reassignToEmail });
    const reassignTool = new ReassignTicketsTool();
    const reassignResult = await reassignTool.execute(
      {
        oldEmail: employeeEmail,
        newEmail: input.reassignToEmail
      },
      ctx
    );
    results.reassignTickets = reassignResult;

    await tracker.addStep(
      'Reassign Tickets',
      reassignResult.success ? 'SUCCESS' : 'FAILED',
      reassignResult.success ? undefined : reassignResult.message
    );

    // -------------------------------------------------------------
    // Step 4: Mark Employee Inactive / Offboarded
    // -------------------------------------------------------------
    ctx.logger.info('Step 4: Marking employee status as Offboarded...');
    const markInactiveTool = new MarkEmployeeInactiveTool();
    const inactiveResult = await markInactiveTool.execute({ email: employeeEmail }, ctx);
    results.markEmployeeInactive = inactiveResult;

    await tracker.addStep(
      'Mark Employee Inactive',
      inactiveResult.success ? 'SUCCESS' : 'FAILED',
      inactiveResult.success ? undefined : inactiveResult.message
    );

    const summary = await tracker.finishWorkflow();
    ctx.logger.info('Full Offboarding Workflow Completed', { employeeEmail, summary });

    return {
      success: true,
      message: `Full offboarding workflow successfully executed for ${employeeEmail}`,
      data: {
        email: employeeEmail,
        status: inactiveResult.data?.status || 'Offboarded',
        revokedPlatforms,
        reassignedTicketsCount: reassignResult.data?.totalReassigned || 0,
        ticketsTransferredTo: input.reassignToEmail
      },
      workflowSummary: summary,
      stepResults: results
    };
  } catch (error) {
    const errMsg = (error as Error).message;
    ctx.logger.error('Critical Error in Full Offboarding Workflow', { error: errMsg });

    await tracker.addStep('Workflow Execution', 'FAILED', errMsg);
    const summary = await tracker.finishWorkflow();

    return {
      success: false,
      message: `Full offboarding workflow failed: ${errMsg}`,
      workflowSummary: summary,
      stepResults: results
    };
  }
}
