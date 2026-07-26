import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { writeDB, readDB } from '../../utils/db.js';

/**
 * InitiateOffboardingTool
 *
 * A partial/draft tool the LLM calls immediately when a user mentions offboarding an employee.
 * Accepts ONLY the info known so far (email alone is enough) and returns a state
 * that the OffboardingWidget can render with pending/placeholder values.
 * Also persists the draft to the employees.json resource.
 */
export class InitiateOffboardingTool {

  @Tool({
    name: 'initiateOffboarding',
    description: `**DRAFT TOOL** — Call IMMEDIATELY when a user mentions offboarding an employee.
Accepts partial details. Missing fields get placeholder values so the widget renders at once.
The LLM should call this tool as soon as the employee's email is known, then call updateOffboardingDraft as more info arrives.`,
    inputSchema: z.object({
      employeeEmail: z.string().optional().describe('The company email of the employee to offboard'),
      reassignEmail: z.string().optional().describe('The email of the employee who will take over tickets')
    })
  })
  @Widget('/offboarding')
  async execute(input: {
    employeeEmail?: string;
    reassignEmail?: string;
  }, ctx: ExecutionContext) {
    const employeeEmail = input.employeeEmail || 'TBD';
    const reassignEmail = input.reassignEmail || 'TBD';

    ctx.logger.info(`[initiateOffboarding] Draft started for "${employeeEmail}"`);

    // Persist draft to employees.json — mark the employee as Offboarding Draft
    if (input.employeeEmail) {
      try {
        // Only persist if we have an email — otherwise there's nothing to look up
        const employees = await readDB('employees.json');
        const empIdx = employees.findIndex((e: any) => e.email === input.employeeEmail);
        if (empIdx >= 0) {
          employees[empIdx].status = 'Offboarding Draft';
          employees[empIdx]._offboardingDraft = {
            reassignEmail,
            status: 'Pending',
            _createdAt: new Date().toISOString()
          };
          await writeDB('employees.json', employees);
          ctx.logger.info(`[initiateOffboarding] Updated status in employees.json for "${employeeEmail}"`);
        }
      } catch (err) {
        ctx.logger.error(`[initiateOffboarding] Failed to update employees.json: ${err}`);
      }
    }

    return {
      success: true,
      message: `🚪 Offboarding draft created for **${employeeEmail}**. I'll start reviewing systems to revoke.`,
      data: {
        employeeName: employeeEmail,
        status: 'Pending',
        revokedSystems: [
          { name: 'Google Workspace', revoked: false },
          { name: 'Slack', revoked: false },
          { name: 'GitHub', revoked: false }
        ],
        ticketReassignment: {
          count: 'Yet to be determined',
          assignedTo: reassignEmail !== 'TBD' ? reassignEmail : 'Yet to be updated',
          done: false
        }
      }
    };
  }
}
