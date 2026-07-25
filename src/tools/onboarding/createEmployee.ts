// import { ExecutionContext } from '@nitrostack/core';

// export class CreateEmployeeTool {
//   async execute(input: { name: string; email: string; role: string; startDate: string }, ctx: ExecutionContext) {
//     ctx.logger.info('Creating employee profile', { name: input.name, role: input.role });

//     // TODO: Implement real employee creation and persistence
//     return {
//       success: true,
//       message: `TODO: Implement creating employee ${input.name} as ${input.role}`,
//       data: {
//         name: input.name,
//         email: input.email,
//         role: input.role,
//         startDate: input.startDate,
//         status: 'Pending'
//       }
//     };
//   }
// }


import { ExecutionContext } from '@nitrostack/core';
import { readFile, writeFile } from 'node:fs/promises';
import { getResourcePath } from '../utils.js';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  startDate: string;
  status: 'Onboarding' | 'Active' | 'Offboarded';
  provisionedAccounts: string[];
  assignedTraining: string[];
}

export class CreateEmployeeTool {
  async execute(
    input: { name: string; email?: string; role: string; startDate: string },
    ctx: ExecutionContext
  ) {
    ctx.logger.info('Creating employee profile', { name: input.name, role: input.role });

    try {
      const filePath = getResourcePath('employees.json');

      let employees: Employee[] = [];
      try {
        const fileData = await readFile(filePath, 'utf-8');
        employees = JSON.parse(fileData);
      } catch (readError) {
        ctx.logger.warn('employees.json missing or unreadable, starting empty', {
          error: (readError as Error).message
        });
      }

      const email = input.email || `${input.name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
      const id = `emp-${Date.now().toString().slice(-4)}`;

      const newEmployee: Employee = {
        id,
        name: input.name,
        email,
        role: input.role,
        startDate: input.startDate,
        status: 'Onboarding',
        provisionedAccounts: [],
        assignedTraining: []
      };

      employees.push(newEmployee);
      await writeFile(filePath, JSON.stringify(employees, null, 2), 'utf-8');

      ctx.logger.info('Successfully created employee profile', { id, name: input.name });

      return {
        success: true,
        message: `Successfully created employee profile for ${input.name}`,
        data: newEmployee
      };
    } catch (error) {
      ctx.logger.error('Failed to create employee', { error: (error as Error).message });

      return {
        success: false,
        message: `Failed to create employee profile: ${(error as Error).message}`,
        data: null
      };
    }
  }
}
