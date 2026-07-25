import { ExecutionContext } from '@nitrostack/core';
import { readDB } from '../utils/db';

export class FetchRoleRequirementsTool {
	async execute(input: { role: string }, ctx: ExecutionContext) {
		ctx.logger.info('Fetching role requirements', { role: input.role });

		// Read the roles.json database using our helper
		const rolesData = await readDB('roles.json');

		if (!rolesData) {
			ctx.logger.error('Failed to load roles.json database');
			return {
				success: false,
				message: 'Database error: Unable to read roles data.',
				data: null
			};
		}

		// Look up the requested role from the database
		const roleInfo = rolesData[input.role];

		if (!roleInfo) {
			ctx.logger.warn(`Role '${input.role}' not found in roles database`);
			return {
				success: false,
				message: `Role '${input.role}' was not found in roles database.`,
				data: {
					role: input.role,
					software: [],
					training: [],
					channels: []
				}
			};
		}

		ctx.logger.info(`Successfully fetched requirements for ${input.role}`);

		return {
			success: true,
			message: `Successfully fetched requirements for role: ${input.role}`,
			data: {
				role: input.role,
				software: roleInfo.software || [],
				training: roleInfo.training || [],
				channels: roleInfo.channels || []
			}
		};
	}
}