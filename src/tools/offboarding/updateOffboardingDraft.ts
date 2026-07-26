import { ToolDecorator as Tool, Widget, ExecutionContext, z } from '@nitrostack/core';
import { writeDB, readDB } from '../../utils/db.js';

/**
 * UpdateOffboardingDraftTool
 *
 * Incremental update tool that the LLM calls as the user provides more details
 * (reassign email, system access findings, etc.) during an offboarding chat.
 * Also persists the updated draft to employees.json.
 */
export class UpdateOffboardingDraftTool {

  @Tool({
    name: 'updateOffboardingDraft',
    description: `**INCREMENTAL UPDATE TOOL** — Call AFTER initiateOffboarding when more details emerge.
Updates the offboarding widget state — e.g., when the reassign email is provided or systems are identified.`,
    inputSchema: z.object({
      employeeEmail: z.string().describe('The employee email (must match from initiateOffboarding)'),
      reassignEmail: z.string().optional().describe('The email of the employee taking over tickets (if newly provided)'),
      revokedSystems: z.array(z.object({
        name: z.string().describe('Platform name'),
        revoked: z.boolean().describe('Whether access has been revoked')
      })).optional().describe('Updated list of systems and their revocation status'),
      ticketCount: z.number().optional().describe('Number of tickets to reassign (if known)')
    })
  })
  @Widget('/offboarding')
  async execute(input: {
    employeeEmail: string;
    reassignEmail?: string;
    revokedSystems?: { name: string; revoked: boolean }[];
    ticketCount?: number;
  }, ctx: ExecutionContext) {
    ctx.logger.info(`[updateOffboardingDraft] Updating offboarding draft for "${input.employeeEmail}"`);

    // Persist updates to employees.json
    try {
      const employees = await readDB('employees.json');
      const empIdx = employees.findIndex((e: any) => e.email === input.employeeEmail);
      if (empIdx >= 0) {
        if (!employees[empIdx]._offboardingDraft) {
          employees[empIdx]._offboardingDraft = {};
        }
        if (input.reassignEmail) employees[empIdx]._offboardingDraft.reassignEmail = input.reassignEmail;
        if (input.revokedSystems) employees[empIdx]._offboardingDraft.revokedSystems = input.revokedSystems;
        if (input.ticketCount) employees[empIdx]._offboardingDraft.ticketCount = input.ticketCount;
        employees[empIdx]._offboardingDraft._updatedAt = new Date().toISOString();
        await writeDB('employees.json', employees);
        ctx.logger.info(`[updateOffboardingDraft] Updated employees.json for "${input.employeeEmail}"`);
      }
    } catch (err) {
      ctx.logger.error(`[updateOffboardingDraft] Failed to update employees.json: ${err}`);
    }

    // Build the updated state
    const revokedSystems = input.revokedSystems || [
      { name: 'Google Workspace', revoked: false },
      { name: 'Slack', revoked: false },
      { name: 'GitHub', revoked: false }
    ];

    const revokedCount = revokedSystems.filter(r => r.revoked).length;

    const updates: string[] = [];
    if (input.reassignEmail) updates.push(`reassign → ${input.reassignEmail}`);
    if (input.revokedSystems) updates.push(`${revokedCount}/${revokedSystems.length} systems revoked`);

    let status = 'In Progress';
    if (revokedCount === revokedSystems.length && input.reassignEmail) {
      status = 'Ready';
    }

    let message = `✏️ Offboarding draft updated for **${input.employeeEmail}**`;
    if (updates.length > 0) {
      message += ` — ${updates.join(', ')}`;
    }

    return {
      success: true,
      message,
      data: {
        employeeName: input.employeeEmail,
        status,
        revokedSystems,
        ticketReassignment: {
          count: input.ticketCount ?? 'Yet to be determined',
          assignedTo: input.reassignEmail || 'Yet to be updated',
          done: !!input.reassignEmail
        }
      }
    };
  }
}
