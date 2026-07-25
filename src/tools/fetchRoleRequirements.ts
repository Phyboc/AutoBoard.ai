// import { ExecutionContext } from '@nitrostack/core';

// export class FetchRoleRequirementsTool {
//   async execute(input: { role: string }, ctx: ExecutionContext) {
//     ctx.logger.info('Fetching role requirements', { role: input.role });

//     // TODO: Implement real role lookup from roles.json
//     return {
//       success: true,
//       message: `TODO: Implement fetching requirements for role: ${input.role}`,
//       data: {
//         role: input.role,
//         software: [],
//         training: [],
//         channels: []
//       }
//     };
//   }
// }


import { ExecutionContext } from '@nitrostack/core';
import { readFile } from 'node:fs/promises';
import { getResourcePath } from './utils';

export interface RoleRequirements {
  software: string[];
  training: string[];
  channels: string[];
}

export class FetchRoleRequirementsTool {
  async execute(input: { role: string }, ctx: ExecutionContext) {
    ctx.logger.info('Fetching role requirements', { role: input.role });

    try {
      const filePath = getResourcePath('roles.json');
      const fileData = await readFile(filePath, 'utf-8');
      const rolesMap: Record<string, RoleRequirements> = JSON.parse(fileData);

      const requirements = rolesMap[input.role];

      if (!requirements) {
        ctx.logger.warn(`Role requirements not found for: ${input.role}`);
        return {
          success: false,
          message: `Role '${input.role}' was not found in roles.json.`,
          data: {
            role: input.role,
            software: [],
            training: [],
            channels: []
          }
        };
      }

      ctx.logger.info('Successfully fetched role requirements', { role: input.role });

      return {
        success: true,
        message: `Successfully retrieved requirements for ${input.role}`,
        data: {
          role: input.role,
          software: requirements.software,
          training: requirements.training,
          channels: requirements.channels
        }
      };
    } catch (error) {
      ctx.logger.error('Failed to read roles.json', { error: (error as Error).message });

      return {
        success: false,
        message: `Failed to load role requirements: ${(error as Error).message}`,
        data: {
          role: input.role,
          software: [],
          training: [],
          channels: []
        }
      };
    }
  }
}