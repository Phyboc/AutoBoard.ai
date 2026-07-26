import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { writeDB, readDB } from '../../utils/db.js';

/**
 * UpdateOnboardingDraftTool
 *
 * Incremental update tool that the LLM calls as the user provides more details
 * during a chat conversation. It merges new inputs with the existing draft stored
 * in employees.json to ensure previously provided data is preserved, returning
 * a progressively filled widget state.
 */
export class UpdateOnboardingDraftTool {

  @Tool({
    name: 'updateOnboardingDraft',
    description: `**INCREMENTAL UPDATE TOOL** — Call AFTER initiateOnboarding when the user provides more details (email, role, or start date).
Updates the onboarding widget state with new information and returns the refreshed checklist.`,
    inputSchema: z.object({
      employeeName: z.string().describe('The employee name (must match the draft from initiateOnboarding)'),
      employeeEmail: z.string().optional().describe('Company email address (if newly provided)'),
      employeeRole: z.string().optional().describe('Job role/title (if newly provided)'),
      startDate: z.string().optional().describe('Start date (if newly provided)')
    })
  })
  @Widget('/onboarding')
  async execute(input: {
    employeeName: string;
    employeeEmail?: string;
    employeeRole?: string;
    startDate?: string;
  }, ctx: ExecutionContext) {
    const name = input.employeeName;

    ctx.logger.info(`[updateOnboardingDraft] Updating draft for "${name}"`);

    let existingDraft: any = {};
    
    // Fetch and merge updates with the persisted draft in employees.json
    try {
      const employees = await readDB('employees.json');
      const draftIdx = employees.findIndex((e: any) => e.name === name && e._draft === true);
      
      if (draftIdx >= 0) {
        existingDraft = employees[draftIdx];
        
        // Merge only if new valid values are provided
        if (input.employeeEmail) existingDraft.email = input.employeeEmail;
        if (input.employeeRole) existingDraft.role = input.employeeRole;
        if (input.startDate) existingDraft.startDate = input.startDate;
        
        existingDraft._updatedAt = new Date().toISOString();
        await writeDB('employees.json', employees);
        ctx.logger.info(`[updateOnboardingDraft] Merged and updated draft in employees.json for "${name}"`);
      }
    } catch (err) {
      ctx.logger.error(`[updateOnboardingDraft] Failed to update employees.json: ${err}`);
    }

    // Determine current fields, falling back to what was already saved in storage
    const currentEmail = (existingDraft.email && existingDraft.email !== 'TBD') ? existingDraft.email : input.employeeEmail;
    const currentRole = (existingDraft.role && existingDraft.role !== 'TBD') ? existingDraft.role : input.employeeRole;
    const currentStart = (existingDraft.startDate && existingDraft.startDate !== 'TBD') ? existingDraft.startDate : input.startDate;

    const hasEmail = !!currentEmail && currentEmail !== 'TBD';
    const hasRole = !!currentRole && currentRole !== 'TBD';
    const hasStartDate = !!currentStart && currentStart !== 'TBD';

    // Build the updated progress array preserving context
    const progress: { label: string; sublabel: string; done: boolean }[] = [
      {
        label: 'Employee Profile Created',
        sublabel: hasEmail ? `Email: ${currentEmail}` : hasStartDate ? `Start: ${currentStart}` : 'TBD',
        done: hasEmail
      },
      {
        label: 'Fetch Role Requirements',
        sublabel: hasRole ? `Role: ${currentRole}` : 'Yet to be updated',
        done: hasRole
      },
      {
        label: 'Provision Accounts',
        sublabel: hasRole ? 'Ready to provision' : 'NA',
        done: false
      },
      {
        label: 'Assign Training',
        sublabel: hasRole ? 'Ready to assign' : 'NA',
        done: false
      },
      {
        label: 'Send Welcome Email',
        sublabel: hasEmail ? 'Pending' : 'Waiting for email',
        done: false
      }
    ];

    // Compose a message detailing what changed in this turn
    const updates: string[] = [];
    if (input.employeeEmail) updates.push(`email → ${input.employeeEmail}`);
    if (input.employeeRole) updates.push(`role → ${input.employeeRole}`);
    if (input.startDate) updates.push(`start date → ${input.startDate}`);

    let message = `✏️ Draft updated for **${name}**`;
    if (updates.length > 0) {
      message += ` — ${updates.join(', ')}`;
    }

    let status = 'In Progress';
    if (hasEmail && hasRole && hasStartDate) {
      status = 'Ready';
      message += `\n✅ All details collected! Ready to execute the full onboarding workflow.`;
    }

    return {
      success: true,
      message,
      data: {
        actionType: 'GENERIC_PROGRESS',
        employeeName: name,
        email: currentEmail || 'TBD',
        role: currentRole || 'TBD',
        status,
        progress
      }
    };
  }
}