import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { writeDB, readDB } from '../../utils/db.js';

/**
 * InitiateOnboardingTool
 *
 * A partial/draft tool the LLM calls immediately when a user mentions a new hire.
 * Accepts ONLY the info known so far (name alone is enough) and returns a state
 * that the OnboardingWidget can render with "NA" / "Yet to be updated" placeholders.
 * Also persists the draft state to the employees.json resource so the MCP resource
 * endpoint reflects it.
 */
export class InitiateOnboardingTool {

  @Tool({
    name: 'initiateOnboarding',
    description: `**DRAFT TOOL** — Call IMMEDIATELY when a user mentions onboarding a new employee.
Accepts partial details. Any missing fields are filled with "TBD" placeholders so the widget renders at once.
The LLM should call this tool as soon as the employee's name is known, then call updateOnboardingDraft as more info is gathered.`,
    inputSchema: z.object({
      employeeName: z.string().optional().describe('The name of the employee being onboarded (can be just first name)'),
      employeeEmail: z.string().optional().describe('Company email address if known'),
      employeeRole: z.string().optional().describe('Job role/title if known'),
      startDate: z.string().optional().describe('Start date if known')
    })
  })
  @Widget('/onboarding')
  async execute(input: {
    employeeName?: string;
    employeeEmail?: string;
    employeeRole?: string;
    startDate?: string;
  }, ctx: ExecutionContext) {
    const name = input.employeeName || 'New Employee';
    const email = input.employeeEmail || 'TBD';
    const role = input.employeeRole || 'TBD';
    const start = input.startDate || 'TBD';

    ctx.logger.info(`[initiateOnboarding] Draft started for "${name}"`);

    // Persist draft state to the employees.json resource file
    try {
      const existing = await readDB('employees.json');
      const draftEntry = {
        id: `draft-${Date.now().toString().slice(-6)}`,
        name,
        email,
        role,
        startDate: start,
        status: 'Onboarding Draft',
        provisionedAccounts: [],
        assignedTraining: [],
        welcomeEmailSent: false,
        _draft: true,
        _createdAt: new Date().toISOString()
      };
      existing.push(draftEntry);
      await writeDB('employees.json', existing);
      ctx.logger.info(`[initiateOnboarding] Draft persisted to employees.json for "${name}"`);
    } catch (err) {
      ctx.logger.error(`[initiateOnboarding] Failed to write draft to employees.json: ${err}`);
    }

    return {
      success: true,
      message: `📋 Onboarding draft created for **${name}**. Fill in the missing details to continue.`,
      data: {
        actionType: 'GENERIC_PROGRESS',
        employeeName: name,
        email,
        role,
        status: 'In Progress',
        progress: [
          {
            label: 'Employee Profile Created',
            sublabel: email !== 'TBD' ? `Email: ${email}` : 'Pending...',
            done: email !== 'TBD'
          },
          {
            label: 'Fetch Role Requirements',
            sublabel: role !== 'TBD' ? `Role: ${role}` : 'Yet to be updated',
            done: role !== 'TBD'
          },
          {
            label: 'Provision Accounts',
            sublabel: role !== 'TBD' ? 'Ready' : 'NA',
            done: false
          },
          {
            label: 'Assign Training',
            sublabel: role !== 'TBD' ? 'Ready' : 'NA',
            done: false
          },
          {
            label: 'Send Welcome Email',
            sublabel: email !== 'TBD' ? 'Pending' : 'Waiting for email',
            done: false
          }
        ]
      }
    };
  }
}
