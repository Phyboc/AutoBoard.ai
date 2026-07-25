import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../../utils/db.js';

interface GetUserAccessInput {
  email: string;
}

export class GetUserAccessTool {
  async execute(input: GetUserAccessInput, ctx: ExecutionContext) {
    ctx.logger.info('Fetching user access', { email: input.email });

    const targetIdentifier = (input.email || '').toLowerCase().trim();

    if (!targetIdentifier) {
      return {
        success: false,
        message: 'Email or user identifier must be provided.',
        data: { email: input.email, name: '', platforms: [] }
      };
    }

    // 1. Read employees using the db utility
    const employees = await readDB('employees.json');

    if (!employees) {
      ctx.logger.error('Failed to read employees.json file');
      return {
        success: false,
        message: 'Failed to access database.',
        data: { email: input.email, name: '', platforms: [] }
      };
    }

    // 2. Find employee record (supports matching by email, id, or partial name)
    const employee = employees.find(
      (e: any) =>
        e.email?.toLowerCase() === targetIdentifier ||
        e.id?.toLowerCase() === targetIdentifier ||
        e.name?.toLowerCase().includes(targetIdentifier)
    );

    if (!employee) {
      ctx.logger.warn(`User matching '${input.email}' not found in database`);
      return {
        success: false,
        message: `User '${input.email}' not found.`,
        data: { email: input.email, name: '', platforms: [] }
      };
    }

    // Resolves provisionedAccounts (default schema) or accounts fallback
    const platforms: string[] = employee.provisionedAccounts || employee.accounts || [];
    ctx.logger.info(`Found ${platforms.length} active platform(s) for ${employee.email}`);

    return {
      success: true,
      message: `Retrieved active platforms for ${employee.name}`,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        status: employee.status,
        platforms
      }
    };
  }
}